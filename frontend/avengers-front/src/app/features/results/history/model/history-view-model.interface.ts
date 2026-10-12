import { PageState } from "src/app/core/models/page-state.interface";

export interface HistoryViewModel extends PageState {
    data: any | null;
    lang: 'es' | 'en';
}