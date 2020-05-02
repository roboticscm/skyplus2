import { ViewStore } from '@/store/view';
import { BehaviorSubject } from 'rxjs';
import { Project, File } from '@/modules/task/types';
import {User} from "@/model/user";

export default class Store {
  projects$ = new BehaviorSubject<Project[]>([]);
  uploadFiles$ = new BehaviorSubject<File[]>([]);
  assigneeList$ = new BehaviorSubject<User[]>([]);

  constructor(view: ViewStore) {}

  findProjects = () => {
    this.projects$.next([
      { id: '1', name: 'Project 1', desc: 'Desc 1' },
      { id: '2', name: 'Project 2', desc: 'Desc 2' },
      { id: '3', name: 'Project 3', desc: 'Desc 3' },
    ]);
  };

  findUploadFiles = (taskId: string) => {
    this.uploadFiles$.next([
      { id: '1', name: 'file1.png', fullPath: '/abc' },
      { id: '2', name: 'file2.png', fullPath: '/abc' },
    ]);
  };
}
