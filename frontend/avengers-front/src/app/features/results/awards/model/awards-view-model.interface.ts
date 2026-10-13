import { AwardsModel } from './awards.model';

export interface AwardsViewModel {
  status: 'loading' | 'data' | 'empty' | 'error';
  data: AwardsModel | null;
  error: string | null;
  errorCode: string | null;
}
