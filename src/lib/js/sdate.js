export class SDate {
  static convertMillisecondToDateString(millisecond) {
    if (!millisecond) {
      return '';
    }

    const date = new Date(millisecond);
    return date.toLocaleDateString('vi-VN');
  }

  static convertMillisecondToDateTimeString(millisecond) {
    if (!millisecond) {
      return '';
    }

    const date = new Date(millisecond);
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
