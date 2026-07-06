<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Content;
use App\Models\Activity;
use Illuminate\Support\Facades\DB;

class MigrateLegacyActivities extends Command
{
    protected $signature = 'activities:migrate-legacy';
    protected $description = 'Migrate legacy inline EditorJS activities to the new activities table';

    public function handle()
    {
        $this->info('Starting legacy activity migration...');
        $contents = Content::all();
        $migratedCount = 0;

        DB::beginTransaction();
        try {
            foreach ($contents as $contentRow) {
                if (!$contentRow->text_content) continue;

                $data = $contentRow->text_content;
                if (!isset($data['blocks'])) continue;

                $blocks = $data['blocks'];
                $hasChanges = false;

                foreach ($blocks as &$block) {
                    // Check if it's the old activity block
                    if ($block['type'] === 'activity' && isset($block['data'])) {
                        // Create a new activity in the db
                        $activityTitle = 'Migrated Activity - ' . ($contentRow->title ?? 'Content ' . $contentRow->id);
                        
                        $activity = Activity::create([
                            'tenant_id' => $contentRow->tenant_id,
                            'title' => $activityTitle,
                            'type' => 'custom', // Assuming legacy is custom builder style
                            'data_json' => $block['data'],
                            'created_by' => null
                        ]);

                        // Replace the old block with the new embed block
                        $block = [
                            'id' => $block['id'] ?? uniqid(),
                            'type' => 'activityEmbed',
                            'data' => [
                                'activity_id' => $activity->id,
                                'title' => $activityTitle
                            ]
                        ];
                        
                        $hasChanges = true;
                        $migratedCount++;
                    }
                }

                if ($hasChanges) {
                    $contentRow->text_content = $data;
                    $contentRow->save();
                }
            }

            DB::commit();
            $this->info("Successfully migrated {$migratedCount} activities!");
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("Migration failed: " . $e->getMessage());
        }
    }
}
