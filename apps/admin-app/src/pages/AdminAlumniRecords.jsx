import React, { useState } from 'react';
import { DataTable, AvatarChip, Badge, Button, Modal, SearchBar, FilterSelect } from '@uiu/ui';
import { Eye, MapPin } from 'lucide-react';
import './AdminAlumniRecords.css';

export default function AdminAlumniRecords({ alumniList = [] }) {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [selectedAlumni, setSelectedAlumni] = useState(null);

  const departments = Array.from(new Set(alumniList.map((a) => a.department).filter(Boolean)));

  const filteredAlumni = alumniList.filter((a) => {
    const matchesSearch =
      (a.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.company || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.role || '').toLowerCase().includes(search.toLowerCase());
    const matchesDept = !deptFilter || a.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const columns = [
    {
      header: 'Alumni',
      accessor: 'name',
      render: (r) => (
        <AvatarChip
          name={r.name}
          src={r.avatar}
          subtext={`📍 ${r.location || 'Dhaka, Bangladesh'}`}
          size="md"
        />
      )
    },
    { header: 'Batch', accessor: 'batch', render: (r) => <Badge variant="batch">{r.batch}</Badge> },
    { header: 'Department', accessor: 'department' },
    {
      header: 'Current Role & Organization',
      accessor: 'role',
      render: (r) => (
        <div>
          <span>{r.role}</span>
          <br />
          <span className="text-gold text-small font-semibold">{r.company}</span>
        </div>
      )
    },
    {
      header: 'Mentoring',
      accessor: 'isMentor',
      render: (r) => (
        <Badge variant={r.isMentor ? 'success' : 'neutral'}>
          {r.isMentor ? 'Yes' : 'No'}
        </Badge>
      )
    },
    {
      header: 'Total Donated',
      accessor: 'totalDonated',
      render: (r) => <span className="font-mono font-semibold">৳{(r.totalDonated || 0).toLocaleString()}</span>
    },
    {
      header: 'Actions',
      accessor: 'actions',
      align: 'right',
      render: (r) => (
        <Button
          variant="outline"
          size="sm"
          icon={Eye}
          onClick={() => setSelectedAlumni(r)}
        >
          View Record
        </Button>
      )
    }
  ];

  return (
    <div className="admin-alumni-records-page">
      <div className="page-header-row">
        <div>
          <h1 className="heading-h1">Official Alumni Records Database</h1>
          <p className="text-muted">Master dataset of all verified UIU alumni accounts.</p>
        </div>
      </div>

      <div className="filter-bar-card">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by alumni name, company, or job title..."
        />
        <FilterSelect
          value={deptFilter}
          onChange={setDeptFilter}
          options={departments}
          label="All Departments"
        />
      </div>

      <DataTable columns={columns} data={filteredAlumni} />

      {selectedAlumni && (
        <Modal
          isOpen={Boolean(selectedAlumni)}
          onClose={() => setSelectedAlumni(null)}
          title={`Alumni Record: ${selectedAlumni.name}`}
          subtitle={`${selectedAlumni.batch} • ${selectedAlumni.department}`}
          maxWidth="600px"
        >
          <div className="modal-profile-header">
            <AvatarChip name={selectedAlumni.name} src={selectedAlumni.avatar} size="lg" />
            <div>
              <h3>{selectedAlumni.role}</h3>
              <p className="text-gold font-semibold">{selectedAlumni.company}</p>
              <p className="text-small text-muted"><MapPin size={13} /> {selectedAlumni.location || 'Dhaka, Bangladesh'}</p>
            </div>
          </div>

          <div className="modal-profile-section">
            <h4 className="modal-section-title">Verified Email & Contact</h4>
            <p className="text-body font-mono">{selectedAlumni.email || 'N/A'}</p>
          </div>

          <div className="modal-profile-section">
            <h4 className="modal-section-title">Biography & Career Summary</h4>
            <p className="text-body">{selectedAlumni.bio || 'Verified UIU Graduate'}</p>
          </div>

          <div className="modal-profile-section">
            <h4 className="modal-section-title">Lifetime University Contributions</h4>
            <p className="text-body font-mono font-semibold text-gold">
              Total Donated: ৳{(selectedAlumni.totalDonated || 0).toLocaleString()}
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
