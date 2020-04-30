import { ViewStore } from '@/store/view';
import { BehaviorSubject } from 'rxjs';
import { Project } from '@/modules/task/types';

export default class Store {
  projects$ = new BehaviorSubject<Project[]>([]);

  constructor(view: ViewStore) {}

  findProjects = () => {
    this.projects$.next([
      { id: '1', name: 'Project 1', desc: 'Desc 1' },
      { id: '2', name: 'Project 2', desc: 'Desc 2' },
      { id: '3', name: 'Project 3', desc: 'Desc 3' },
    ]);
  };
}
