import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/api-config';
import { CreateLabelRequest, Label, UpdateLabelRequest } from '../../core/models/label.model';

@Injectable({ providedIn: 'root' })
export class LabelsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/labels`;

  getAll(): Promise<Label[]> {
    return firstValueFrom(this.http.get<Label[]>(this.baseUrl));
  }

  create(request: CreateLabelRequest): Promise<Label> {
    return firstValueFrom(this.http.post<Label>(this.baseUrl, request));
  }

  update(id: string, request: UpdateLabelRequest): Promise<Label> {
    return firstValueFrom(this.http.put<Label>(`${this.baseUrl}/${id}`, request));
  }

  delete(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${id}`));
  }
}
