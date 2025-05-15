
import { addBreadcrumb, setTags, setUser } from '../browser';
import { captureException } from '../core/capture';

export function useLogRaven() {
  return {
    captureException,
    addBreadcrumb,
    setUser,
    setTags,
  };
}
