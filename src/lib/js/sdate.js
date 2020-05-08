export class SDate {
  static convertMilisecondToDateString(milisecond) {
    const date = new Date(milisecond);
    return date.toLocaleDateString('vi-VN');
  }

  static convertMilisecondToDateTimeString(milisecond) {
    const date = new Date(milisecond);
    return (
      date.toLocaleString('vi-VN', {
        dateStyle: 'short',
      }) +
      ', ' +
      date.toLocaleString('vi-VN', {
        timeStyle: 'short',
      })
    );
  }

  static toDateString(date) {
    return date.toLocaleDateString('vi-VN');
  }

  static toDateTimeString(date) {
    return (
      date.toLocaleString('vi-VN', {
        dateStyle: 'short',
      }) +
      ', ' +
      date.toLocaleString('vi-VN', {
        timeStyle: 'short',
      })
    );
  }
}
