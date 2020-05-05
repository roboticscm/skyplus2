import { ViewStore } from '@/store/view';
import { BehaviorSubject } from 'rxjs';
import { Project, File, QuantitativeComment, QualitativeComment, TaskStatus, Task, Priority } from '../types';
import { User } from '@/model/user';
import { OwnerOrg } from '@/modules/sys/owner-org/model';

export default class Store {
  projects$ = new BehaviorSubject<Project[]>([]);
  priority$ = new BehaviorSubject<Priority[]>([]);
  uploadFiles$ = new BehaviorSubject<File[]>([]);
  characteristicTaskList$ = new BehaviorSubject<OwnerOrg[]>([]);
  assigneeList$ = new BehaviorSubject<User[]>([]);
  assignerList$ = new BehaviorSubject<User[]>([]);
  accessorList$ = new BehaviorSubject<User[]>([]);

  quantitativeComment$ = new BehaviorSubject<QuantitativeComment[]>([]);
  qualitativeComment$ = new BehaviorSubject<QualitativeComment[]>([]);

  assigneeStatusList$ = new BehaviorSubject<any[]>([]);
  assignerStatusList$ = new BehaviorSubject<any[]>([]);

  taskStatus$ = new BehaviorSubject<TaskStatus[]>([]);

  taskList$ = new BehaviorSubject<Task[]>([]);
  projectList$ = new BehaviorSubject<Project[]>([]);

  showDashboard$ = new BehaviorSubject<boolean>(false);

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
      { id: '2', date: new Date(), status: 'stop....', note: 'Note2...' },
    ]);

    this.taskStatus$.next([
      { id: '1', name: 'Status 1' },
      { id: '2', name: 'Status 2' },
      { id: '3', name: 'Status 3' },
    ]);

    this.taskList$.next([
      {
        id: '1',
        name: 'Build KkyHub core',
        projectId: '1',
        projectName: 'SkyHub',
        startTime: Date.now(),
        deadline: Date.now(),
        lastStatusName: 'Finish',
      },
      {
        id: '2',
        name: 'Build Task management module',
        projectId: '1',
        projectName: 'SkyHub',
        startTime: Date.now(),
        deadline: Date.now(),
        lastStatusName: 'Open',
      },
      {
        id: '3',
        name: 'Build Quotation  module',
        projectId: '1',
        projectName: 'SkyHub',
        startTime: Date.now(),
        deadline: Date.now(),
        lastStatusName: 'Open',
      },
      {
        id: '4',
        name: 'Build Dashboard',
        projectId: '2',
        projectName: 'SkyOne',
        startTime: Date.now(),
        deadline: Date.now(),
        lastStatusName: 'Finish',
      },
    ]);

    this.projectList$.next([
      { id: '1', name: 'SkyHub', inProgressTask: 5, completedTask: 15, notStartedTask: 2 },
      { id: '2', name: 'SkyOne', inProgressTask: 6, completedTask: 25, notStartedTask: 5 },
    ]);

    this.priority$.next([
      { id: '1', name: 'Low' },
      { id: '2', name: 'Medium' },
      { id: '3', name: 'High' },
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
