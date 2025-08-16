// @ts-nocheck
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Pipe, PipeTransform, Injectable, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, Directive, Input, Output } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { Observable, of as observableOf, throwError } from 'rxjs';

import { Component } from '@angular/core';
import { PostComponent } from './post.component';
import { provideHttpClient } from '@angular/common/http';
import { provideMockStore } from '@ngrx/store/testing';

describe('PostComponent', () => {
  let fixture;
  let component;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ FormsModule, ReactiveFormsModule ],
  
      schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ],
      providers: [
provideHttpClient(),
provideMockStore({})
      ]
    }).overrideComponent(PostComponent, {

    }).compileComponents();
    fixture = TestBed.createComponent(PostComponent);
    component = fixture.debugElement.componentInstance;
  });


  it('should run #constructor()', async () => {
    expect(component).toBeTruthy();
  });

  it('should run #viewPost()', async () => {
    component.router = component.router || {};
    component.router.navigate = jest.fn();
    component.post = component.post || {};
    component.post._id = '_id';
    component.viewPost();
  });

  it('should run #editPost()', async () => {
    component.dialog = component.dialog || {};
    component.dialog.open = jest.fn().mockReturnValue({
      afterClosed: function() {
        return observableOf({});
      }
    });
    component.store = component.store || {};
    component.store.dispatch = jest.fn();
    component.editPost({});
    expect(component.dialog.open).toHaveBeenCalled();
  });

});