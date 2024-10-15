import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabelMenuComponent } from './label-menu.component';


describe('LabelMenuComponent', () => {
  let component: LabelMenuComponent;
  let fixture: ComponentFixture<LabelMenuComponent>;

  beforeEach(async () => {
      await TestBed.configureTestingModule({
          imports: [LabelMenuComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LabelMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
