import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

interface Content {
  id: number;
  name: string;
  title?: string;
  text_content?: string;
  attachments?: any[];
  external_url?: any[];
  assessments?: any[];
  sort_order?: number;
  is_active?: boolean;
}

interface Chapter {
  id: number;
  name: string;
  contents: Content[];
  assessments?: any[];
  is_expanded?: boolean;
}

interface Level {
  id: number;
  name: string;
  chapters: Chapter[];
  is_expanded?: boolean;
}

interface CourseStructure {
  id: number;
  name: string;
  description?: string;
  levels: Level[];
}

import { McvDatatree, McvDatatreeNode } from 'mcv-ui-toolkit';
import { RouterModule } from '@angular/router';
import { ActivityRenderer } from '../activity-engine/activity-renderer';

@Component({
  selector: 'app-course-player',
  standalone: true,
  imports: [CommonModule, McvDatatree, RouterModule, ActivityRenderer],
  templateUrl: './course-player.html',
  styleUrls: ['./course-player.css']
})
export class CoursePlayer implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  courseId = signal<number | null>(null);
  userId = signal<number>(1);

  courseStructure = signal<CourseStructure | null>(null);
  treeData = signal<McvDatatreeNode[]>([]);
  activeContentId = signal<number | null>(null);
  fullContent = signal<Content | null>(null);

  // Computed values
  activeContent = computed(() => {
    const id = this.activeContentId();
    const full = this.fullContent();
    
    if (!id || !this.courseStructure()) return null;

    // If we have full content and its ID matches the active ID, return it
    if (full && full.id === id) {
      // Find chapter assessments to append
      for (const level of this.courseStructure()!.levels) {
        for (const chapter of level.chapters) {
          const topic = chapter.contents.find(c => c.id === id);
          if (topic) {
            return { ...full, assessments: chapter.assessments };
          }
        }
      }
      return full;
    }

    // Fallback to sidebar structure (titles only) while loading
    for (const level of this.courseStructure()!.levels) {
      for (const chapter of level.chapters) {
        const content = chapter.contents.find(c => c.id === id);
        if (content) {
          return { ...content, assessments: chapter.assessments };
        }
      }
    }
    return null;
  });

  isJsonContent = computed(() => {
    const content = this.activeContent();
    if (!content || !content.text_content) return false;
    const trimmed = content.text_content.trim();
    return trimmed.startsWith('{') && trimmed.endsWith('}');
  });

  parsedBlocks = computed(() => {
    const content = this.activeContent();
    if (!content || !content.text_content) return [];
    try {
      const data = JSON.parse(content.text_content);
      return data.blocks || [];
    } catch (e) {
      console.warn('Failed to parse text_content as JSON blocks, rendering as HTML instead.');
      return [];
    }
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['courseId']) {
        this.courseId.set(+params['courseId']);
        this.loadStructure();
      }
    });

    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.courseId.set(+params['id']);
        this.loadStructure();
      }
    });
  }

  loadStructure(): void {
    if (!this.courseId()) return;

    const url = `http://localhost:8000/api/courses/${this.courseId()}/player-structure`;
    this.http.get<CourseStructure>(url).subscribe({
      next: (structure) => {
        // Initialize expansion states
        structure.levels.forEach((l, idx) => {
          l.is_expanded = idx === 0; 
          l.chapters.forEach((c, cidx) => {
            c.is_expanded = idx === 0 && cidx === 0;
          });
        });
        this.courseStructure.set(structure);
        this.treeData.set(this.mapStructureToTree(structure));

        // Auto-select first topic
        if (structure.levels[0]?.chapters[0]?.contents[0]) {
          this.selectTopic(structure.levels[0].chapters[0].contents[0].id);
        }
      },
      error: (err) => console.error('Failed to load course structure:', err)
    });
  }

  selectTopic(id: number): void {
    this.activeContentId.set(id);
    this.fullContent.set(null); // Reset while loading

    // Fetch full content details
    const url = `http://localhost:8000/api/contents/${id}`;
    this.http.get<Content>(url).subscribe({
      next: (content) => {
        this.fullContent.set(content);
      },
      error: (err) => console.error('Failed to load topic content:', err)
    });
  }

  toggleLevel(level: Level): void {
    level.is_expanded = !level.is_expanded;
  }

  toggleChapter(chapter: Chapter): void {
    chapter.is_expanded = !chapter.is_expanded;
  }

  mapStructureToTree(structure: CourseStructure): McvDatatreeNode[] {
    return structure.levels.map((level) => ({
      id: `level-${level.id}`,
      label: level.name,
      expanded: level.is_expanded,
      children: level.chapters.map((chapter) => ({
        id: `chapter-${chapter.id}`,
        label: chapter.name,
        expanded: chapter.is_expanded,
        children: chapter.contents.map((topic) => ({
          id: `topic-${topic.id}`,
          label: topic.title || topic.name,
        })),
      })),
    }));
  }

  handleNodeClick(node: McvDatatreeNode): void {
    if (node.id.startsWith('topic-')) {
      const topicId = parseInt(node.id.replace('topic-', ''), 10);
      this.selectTopic(topicId);
    }
  }
}
