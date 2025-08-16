
import { createAction, props } from '@ngrx/store';
import { Post } from '../models/post.model';

export enum PostActionType {
  Load = '[Post Component] Load',
  CreatePost = '[Post Component] Create Post',
  LoadSuccess = '[Post API] Load Success',
}

export const load = createAction(PostActionType.Load);


export const createPost = createAction(
  PostActionType.CreatePost,
  props<{ post: Post, ref: any }>()
);
export const loadSuccess = createAction(
  PostActionType.LoadSuccess,
  props<{ posts: Post[] }>()
);
