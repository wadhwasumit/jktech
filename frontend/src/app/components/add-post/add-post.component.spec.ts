// @ts-nocheck
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Pipe, PipeTransform, Injectable, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, Directive, Input, Output } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { Observable, of as observableOf, throwError } from 'rxjs';

import { Component } from '@angular/core';
import { AddPostComponent } from './add-post.component';
import { provideHttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

describe('AddPostComponent', () => {
  let fixture;
  let component;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ FormsModule, ReactiveFormsModule ],
 
      schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ],
      providers: [

        provideHttpClient(),
        { provide: MatDialogRef, useValue: {} }, // ✅ Mock MatDialogRef
        { provide: MAT_DIALOG_DATA, useValue: {} } // ✅ Provide mock data
      ]
    }).overrideComponent(AddPostComponent, {

    }).compileComponents();
    fixture = TestBed.createComponent(AddPostComponent);
    component = fixture.debugElement.componentInstance;
  });


  it('should run #constructor()', async () => {
    expect(component).toBeTruthy();
  });

  it('should run #ngOnInit()', async () => {
    component.fb = component.fb || {};
    component.fb.group = jest.fn().mockReturnValue({
      patchValue: function() {}
    });
    component.data = component.data || {};
    component.data.post = 'post';
    component.ngOnInit();
    expect(component.fb.group).toHaveBeenCalled();
  });

  it('should run #getControl()', async () => {
    component.postForm = component.postForm || {};
    component.postForm.get = jest.fn();
    component.getControl({});
    expect(component.postForm.get).toHaveBeenCalled();
  });

  it('should run #savePost()', async () => {
    component.postService = component.postService || {};
    component.postService.createPost = jest.fn().mockReturnValue(observableOf({}));
    component.postForm = component.postForm || {};
    component.postForm.value = 'value';
    component._snackBar = component._snackBar || {};
    component._snackBar.open = jest.fn();
    component.savePost();
    expect(component.postService.createPost).toHaveBeenCalled();
  });

  it('should run #updatePost()', async () => {
    component.postService = component.postService || {};
    component.postService.updatePost = jest.fn().mockReturnValue(observableOf({}));
    component.postForm = component.postForm || {};
    component.postForm.value = 'value';
    component.data = component.data || {};
    component.data.post = {
      _id: {}
    };
    component._snackBar = component._snackBar || {};
    component._snackBar.open = jest.fn();
    component.updatePost();
    expect(component.postService.updatePost).toHaveBeenCalled();
  });

});