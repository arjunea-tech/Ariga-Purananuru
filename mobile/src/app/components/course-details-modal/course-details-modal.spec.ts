import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseDetailsModal } from './course-details-modal';

describe('CourseDetailsModal', () => {
  let component: CourseDetailsModal;
  let fixture: ComponentFixture<CourseDetailsModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseDetailsModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseDetailsModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
