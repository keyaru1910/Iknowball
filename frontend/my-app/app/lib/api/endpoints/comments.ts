import { apiFetch } from '../client'; export type Comment={id:string;content:string;createdAt:string;isEdited:boolean;user:{id:string;fullName:string|null;avatarUrl:string|null};replies:Comment[]};
export const getComments=(entityId:string)=>apiFetch<Comment[]>(`/comments?entityType=NEWS_ARTICLE&entityId=${encodeURIComponent(entityId)}`);
export const createComment=(body:{entityId:string;content:string;parentId?:string})=>apiFetch<Comment>('/comments',{method:'POST',body:JSON.stringify({entityType:'NEWS_ARTICLE',...body})});
