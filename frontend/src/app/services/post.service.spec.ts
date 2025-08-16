// @ts-nocheck
import { async } from '@angular/core/testing';
import { Injectable } from '@angular/core';
import { Observable, of as observableOf, throwError } from 'rxjs';

import { PostService } from './post.service';
import { HttpClient } from '@angular/common/http';

@Injectable()
class MockHttpClient {
  get() { };
}

describe('PostService', () => {
  let service;

  beforeEach(() => {
    service = new PostService({});
  });

  it('should run #getPosts()', async () => {
    service.http = service.http || {};
    service.http.get = jest.fn().mockReturnValue(observableOf({}));
    service.getPosts();
    expect(service.http.get).toHaveBeenCalled();
  });

});