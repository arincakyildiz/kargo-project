import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AuditService } from '../../../../core/services/audit.service';
import { TarihPipe } from '../../../../shared/pipes/tarih.pipe';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, TarihPipe, EmptyStateComponent],
  templateUrl: './audit-log.component.html',
  styleUrl: './audit-log.component.scss',
})
export class AuditLogComponent {
  readonly log = this.audit.log;

  constructor(private audit: AuditService) {}
}
