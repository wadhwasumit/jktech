// @ts-nocheck
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Pipe, PipeTransform, Injectable, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, Directive, Input, Output } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { Observable, of as observableOf, throwError } from 'rxjs';

import { Component } from '@angular/core';
import { PostListComponent } from './post-list.component';
import { MockStore, provideMockStore } from '@ngrx/store/testing';


describe('PostListComponent', () => {
  let fixture;
  let component;
  let store: MockStore;


  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, ReactiveFormsModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
      providers: [
        provideMockStore({ initialState: { posts: [] } })

      ]
    }).overrideComponent(PostListComponent, {

    }).compileComponents();
    fixture = TestBed.createComponent(PostListComponent);
    component = fixture.debugElement.componentInstance;
    store = TestBed.inject(MockStore);
  });


  it('should run #constructor()', async () => {
    expect(component).toBeTruthy();
  });

  it('should run #ngOnInit()', async () => {
    component.store = component.store || {};
    component.store.select = jest.fn();
    component.store.dispatch = jest.fn();
    component.ngOnInit();
    expect(component.store.select).toHaveBeenCalled();
    expect(component.store.dispatch).toHaveBeenCalled();
  });

  it('should run #addPost()', async () => {
    component.dialog = component.dialog || {};
    component.dialog.open = jest.fn().mockReturnValue({
      afterClosed: function () {
        return observableOf({});
      }
    });
    component.addPost();
    expect(component.dialog.open).toHaveBeenCalled();
  });

});