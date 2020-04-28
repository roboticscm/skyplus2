export class Dropdown {
  static show(id: string) {
    const ele: any = document.querySelector(`#${id}`);
    ele && ele.classList.add('show-dropdown');
  }

  static hide(id: string) {
    const ele: any = document.querySelector(`#${id}`);
    ele && ele.classList.remove('show-dropdown');
  }
}
