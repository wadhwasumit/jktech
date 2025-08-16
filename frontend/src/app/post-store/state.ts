import { Post } from "../models/post.model";



export interface State {
  posts: Post[]
}

export const initialState: State = {
  posts: [],
};
