import { SObject } from '@/lib/js/sobject';
import { StringUtil } from '@/lib/js/string-util';
import { markStringSearch } from '@/lib/js/util';

export class Mark {
  static mark(source, keywords) {
    const src = SObject.clone(source);
    if (StringUtil.isEmpty(keywords) || !['string', 'object'].includes(typeof src)) {
      return src;
    }

    if (typeof src === 'string') {
      return markStringSearch(src, keywords, true);
    }

    if (Array.isArray(src)) {
      for (let i = 0; i < src.length; i++) {
        if (typeof src[i] === 'object') {
          src[i] = this.mark(src[i], keywords);
        } else if (typeof src[i] === 'string') {
          src[i] = markStringSearch(src[i], keywords, true);
        }
      }
    } else if (typeof src === 'object') {
      for (const field in src) {
        if (typeof src[field] === 'string') {
          src[field] = markStringSearch(src[field], keywords, true);
        } else if (typeof src[field] === 'object') {
          src[i] = this.mark(src[field], keywords);
        }
      }
    }
    return src;
  }
}
