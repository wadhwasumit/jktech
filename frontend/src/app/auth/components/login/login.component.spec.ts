// @ts-nocheck
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Pipe, PipeTransform, Injectable, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, Directive, Input, Output } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { Observable, of as observableOf, throwError } from 'rxjs';

import { Component } from '@angular/core';
import { LoginComponent } from './login.component';
import { AuthService } from '../../service/auth.service';
import { provideHttpClient } from '@angular/common/http';

@Injectable()
class MockAuthService {}


describe('LoginComponent', () => {
  let fixture;
  let component;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ FormsModule, ReactiveFormsModule ],

      schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ],
      providers: [
        { provide: AuthService, useClass: MockAuthService },
        provideHttpClient()
      ]
    }).overrideComponent(LoginComponent, {

    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.debugElement.componentInstance;
  });

  it('should run #constructor()', async () => {
    expect(component).toBeTruthy();
  });

  it('should run #loginWithGoogle()', async () => {
    component.authService = component.authService || {};
    component.authService.googleLogin = jest.fn();
    component.loginWithGoogle();
    expect(component.authService.googleLogin).toHaveBeenCalled();
  });

  it('should run #onGoogleLogin()', async () => {

    component.onGoogleLogin();

  });

  it('should run #onFacebookLogin()', async () => {

    component.onFacebookLogin();

  });

});