// @ts-nocheck
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Pipe, PipeTransform, Injectable, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, Directive, Input, Output } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { Observable, of as observableOf, throwError } from 'rxjs';

import { Component } from '@angular/core';
import { PostDetailComponent } from './post-detail.component';
import { PostService } from '../../services/post.service';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

@Injectable()
class MockPostService {
  getPostById = function() {};
}


describe('PostDetailComponent', () => {
  let fixture;
  let component;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ FormsModule, ReactiveFormsModule, ],

      schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ],
      providers: [
        { provide: PostService, useClass: MockPostService },
        provideHttpClient(),
        { 
          provide: ActivatedRoute, 
          useValue: { snapshot: { paramMap: { get: () => '123' } } } // ✅ Simple Mock
        }
      ]
    }).overrideComponent(PostDetailComponent, {

    }).compileComponents();
    fixture = TestBed.createComponent(PostDetailComponent);
    component = fixture.debugElement.componentInstance;
  });



  it('should run #constructor()', async () => {
    expect(component).toBeTruthy();
  });

});