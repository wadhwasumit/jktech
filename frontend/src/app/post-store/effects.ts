
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {  concatMap, map  } from 'rxjs/operators';

import * as postActions from './actions';
import { PostService } from '../services/post.service';


@Injectable()
export class PostStoreEffects {
  private actions$ = inject(Actions);
  private postService =  inject(PostService);

  loadRequestEffect$ = createEffect(() =>
    this.actions$.pipe(
      ofType(postActions.load),
      concatMap(() =>
        this.postService.getPosts()
          .pipe(
            map(items =>
              postActions.loadSuccess({
                posts: items
              })
            )
          )
      )
    )
  );

}
