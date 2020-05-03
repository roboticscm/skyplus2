import { ViewStore } from '@/store/view';
import { BehaviorSubject } from 'rxjs';
import {Project, File, QuantitativeComment, QualitativeComment, TaskStatus} from '@/modules/task/types';
import { User } from '@/model/user';

export default class Store {
  projects$ = new BehaviorSubject<Project[]>([]);
  uploadFiles$ = new BehaviorSubject<File[]>([]);
  assigneeList$ = new BehaviorSubject<User[]>([]);
  assignerList$ = new BehaviorSubject<User[]>([]);
  accessorList$ = new BehaviorSubject<User[]>([]);

  quantitativeComment$ = new BehaviorSubject<QuantitativeComment[]>([]);
  qualitativeComment$ = new BehaviorSubject<QualitativeComment[]>([]);

  assigneeStatusList$ = new BehaviorSubject<any[]>([]);
  assignerStatusList$ = new BehaviorSubject<any[]>([]);

  taskStatus$ = new BehaviorSubject<TaskStatus[]>([]);

  constructor(view: ViewStore) {
    this.qualitativeComment$.next([
      { id: '0', name: '0%' },
      { id: '1', name: '10%' },
      { id: '2', name: '20%' },
      { id: '3', name: '30%' },
      { id: '4', name: '40%' },
      { id: '5', name: '50%' },
      { id: '6', name: '60%' },
      { id: '7', name: '70%' },
      { id: '8', name: '80%' },
      { id: '9', name: '90%' },
      { id: '10', name: '100%' },
    ]);

    this.quantitativeComment$.next([
      { id: '0', name: 'Bad' },
      { id: '0', name: 'So so' },
      { id: '0', name: 'Good' },
      { id: '0', name: 'Excellent' },
    ]);

    this.assigneeStatusList$.next([
      { id: '1', date: new Date(), percent: '100%', note: 'Note1...', attach: 'xxxx' },
      { id: '2', date: new Date(), percent: '90%', note: 'Note2...' },
      { id: '1', date: new Date(), percent: '100%', note: 'Note1...' },
      { id: '2', date: new Date(), percent: '90%', note: 'Note2...' },
      { id: '1', date: new Date(), percent: '100%', note: 'Note1...' },
      { id: '2', date: new Date(), percent: '90%', note: 'Note2...' },
      { id: '1', date: new Date(), percent: '100%', note: 'Note1...' },
      { id: '2', date: new Date(), percent: '90%', note: 'Note2...' },
      { id: '1', date: new Date(), percent: '100%', note: 'Note1...', attach: 'xxxx' },
      {
        id: '2',
        date: new Date(),
        percent: '90%',
        note: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Corporis, ullam!',
      },
    ]);

    this.assignerStatusList$.next([
      { id: '1', date: new Date(), status: 'start doing...', note: 'Note1...', attach: 'xxxx' },
      { id: '2', date: new Date(), status: 'stop....', note: 'Note2...' }
      ]);

    this.taskStatus$.next([
      {id: '1', name: 'Status 1'},
      {id: '2', name: 'Status 2'},
      {id: '3', name: 'Status 3'},
    ]);
  }

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
