
import { Action, createReducer, on } from '@ngrx/store';
import * as postActions from './actions';
import { initialState, State } from './state';

const featureReducer = createReducer(
  initialState,

  on(postActions.loadSuccess, (state, { posts }) => {
    return {
      ...state,
      posts,
    };
  }),

);

export function reducer(state: State | undefined, action: Action) {
  return featureReducer(state, action);
}
