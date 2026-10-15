import React from 'react';
import { Card, Button, Badge, DataTable } from '@uiu/ui';
import { Check, X } from 'lucide-react';
import './AdminRegistrations.css';

export default function AdminRegistrations({
  pendingList = [],
  onApprove,
  onDecline
}) {
  const columns = [
    {
      header: 'Applicant Name',
      accessor: 'name',
      render: (r) => (
        <div>
          <strong className="text-navy">{r.name}</strong>
          <br />
          <span className="text-small text-muted">{r.email}</span>
        </div>
      )
    },
    { header: 'Batch Code', accessor: 'batch', render: (r) => <Badge variant="batch">{r.batch}</Badge> },
    { header: 'Department', accessor: 'department' },
    {
      header: 'Current Role & Company',
      accessor: 'currentRole',
      render: (r) => (
        <div>
          <span>{r.currentRole}</span>
          <br />
          <span className="text-gold text-small font-semibold">{r.company}</span>
        </div>
      )
    },
    { header: 'Submitted Date', accessor: 'submittedDate', render: (r) => <span className="font-mono text-small">{r.submittedDate || new Date(r.createdAt || Date.now()).toLocaleDateString()}</span> },
    {
      header: 'Status',
      accessor: 'status',
      render: (r) => {
        const s = r.status || 'Pending';
        const variant = s === 'Approved' ? 'success' : s === 'Declined' ? 'danger' : 'warning';
        return <Badge variant={variant}>{s}</Badge>;
     }
    },
    {
      header: 'Approval Actions',
      accessor: 'actions',
      align: 'right',
      render: (r) => {
        const id = r._id || r.id;
                if (r.status && r.status !== 'Pending') {
          return <span className="text-small text-muted">Reviewed</span>;
        }
        return (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button
              variant="success"
              size="sm"
              icon={Check}
              onClick={() => onApprove(id)}
            >
              Approve
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={X}
              onClick={() => onDecline(id)}
            >
              Decline
            </Button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="admin-registrations-page">
      <div className="page-header-row">
        <div>
          <h1 className="heading-h1">Registration Approval Queue</h1>
          <p className="text-muted">Review self-submitted alumni verification applications before access is granted.</p>
        </div>
        <Badge variant="warning">
          {pendingList.filter((r) => (r.status || 'Pending') === 'Pending').length} Pending Approvals
        </Badge>
      </div>

      <DataTable
        columns={columns}
        data={pendingList}
        emptyMessage="No pending alumni applications in queue."
      />
    </div>
  );
}
