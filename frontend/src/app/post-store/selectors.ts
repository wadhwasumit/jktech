
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';
import { Post } from '../models/post.model';

export const selectPostState = createFeatureSelector<State>('posts');

export const selectPosts$ = createSelector(
    selectPostState,
    (state: State): Post[] => state.posts
);

