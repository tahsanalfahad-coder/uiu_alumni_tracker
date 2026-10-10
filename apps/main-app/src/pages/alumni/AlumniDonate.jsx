import React, { useState } from 'react';
import { Card, Button, Badge, Modal, DataTable, ProgressBar, api } from '@uiu/ui';
import { Heart, GraduationCap, Laptop, Trophy, Clipboard, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';
import './AlumniDonate.css';

export default function AlumniDonate({ donationData, onMakeDonation }) {
  const [donateModalOpen, setDonateModalOpen] = useState(false);
  const [selectedFundId, setSelectedFundId] = useState(donationData?.funds?.[0]?.id || donationData?.funds?.[0]?._id || 'f-1');
  const [amount, setAmount] = useState('5000');
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Mobile Wallet (bKash/Nagad)');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [donateSuccess, setDonateSuccess] = useState(false);

  const fundIcons = {
    graduationCap: GraduationCap,
    laptop: Laptop,
    trophy: Trophy,
    clipboard: Clipboard
  };

  const quickAmounts = ['1000', '5000', '10000', '25000'];

  const columns = [
    { header: 'Fund Targeted', accessor: 'fund', render: (r) => <strong>{r.fund}</strong> },
    { header: 'Amount Donated', accessor: 'amount', render: (r) => <span className="text-gold font-semibold">{r.amount}</span> },
    { header: 'Date', accessor: 'date' },
    { header: 'Transaction ID', accessor: 'txId', render: (r) => <span className="font-mono text-small">{r.txId}</span> },
    { header: 'Status', accessor: 'status', render: (r) => <Badge variant="success"><CheckCircle size={12} /> {r.status}</Badge> }
  ];

  const handleCompleteDonation = async (e) => {
    e.preventDefault();
    const finalAmt = amount === 'other' ? customAmount : amount;
    if (!finalAmt) return;

    try {
      const fundObj = (donationData?.funds || []).find((f) => (f.id || f._id) === selectedFundId) || donationData?.funds?.[0];
      const targetFundId = fundObj?.id || fundObj?._id || selectedFundId;

      const res = await api.post('/donations', {
        fundId: targetFundId,
        amount: parseInt(finalAmt),
        paymentMethod,
        recurring: isRecurring,
        anonymous: isAnonymous
      });

      if (onMakeDonation) onMakeDonation(res.donation);
      setDonateSuccess(true);
      setTimeout(() => {
        setDonateSuccess(false);
        setDonateModalOpen(false);
      }, 1500);
    } catch (err) {
      alert(err.message || 'Donation failed');
    }
  };

  const totalDonated = donationData?.totalDonated || 75000;
  const funds = donationData?.funds || [];
  const history = donationData?.history || [];

  return (
    <div className="alumni-donate-page">
      <div className="page-header-row">
        <div>
          <h1 className="heading-h1">Donate to UIU</h1>
          <p className="text-muted">Empower deserving UIU students and support campus innovation through alumni donations.</p>
        </div>
        <Button variant="accent" icon={Heart} onClick={() => setDonateModalOpen(true)}>
          Make a Donation
        </Button>
      </div>

      {/* Impact Banner Card */}
      <Card variant="navy" className="impact-banner-card">
        <div className="impact-left">
          <div className="impact-icon-wrap">
            <Sparkles size={32} className="text-gold" />
          </div>
          <div>
            <span className="eyebrow-label text-on-navy">Alumni Giving Impact</span>
            <h2 className="heading-h2 text-white">Your Contributions Matter</h2>
            <p className="text-on-navy-muted">
              Together, UIU alumni have funded 120+ full scholarships and built state-of-the-art AI robotics labs.
            </p>
          </div>
        </div>
        <div className="impact-right">
          <span className="eyebrow-label text-gold">My Lifetime Giving</span>
          <h2 className="impact-my-total">৳{totalDonated.toLocaleString()}</h2>
        </div>
      </Card>

      {/* Fund Cards Grid */}
      <div>
        <h2 className="heading-h2 section-sub-title" style={{ marginBottom: '16px' }}>Active University Funds</h2>
        <div className="grid-2-col">
          {funds.map((fund) => {
            const id = fund.id || fund._id;
            const Icon = fundIcons[fund.icon] || Heart;
            return (
              <Card key={id} className="fund-card">
                <div className="fund-card-top">
                  <div className="fund-icon-box">
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="fund-title">{fund.name}</h3>
                    <p className="fund-desc">{fund.description}</p>
                  </div>
                </div>

                <div className="fund-progress-box">
                  <div className="fund-progress-meta">
                    <span className="text-small text-muted">
                      Raised: <strong className="text-navy">৳{fund.raised.toLocaleString()}</strong> of ৳{fund.goal.toLocaleString()}
                    </span>
                  </div>
                  <ProgressBar value={fund.raised} max={fund.goal} variant="gold" height="8px" showLabel />
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Donation History Table */}
      <div>
        <h2 className="heading-h2 section-sub-title" style={{ marginBottom: '16px' }}>My Donation History</h2>
        <DataTable columns={columns} data={history} />
      </div>

      {/* Donation Modal */}
      <Modal
        isOpen={donateModalOpen}
        onClose={() => setDonateModalOpen(false)}
        title="Make a Contribution to UIU"
        subtitle="Choose a fund and select your gift amount"
        maxWidth="550px"
      >
        {donateSuccess ? (
          <div className="text-center-heading" style={{ padding: '20px' }}>
            <CheckCircle size={48} className="text-success" style={{ margin: '0 auto 12px' }} />
            <h3>Thank You for Your Generosity!</h3>
            <p className="text-muted">
              Your contribution receipt has been generated and sent to your email.
            </p>
          </div>
        ) : (
          <form onSubmit={handleCompleteDonation} className="auth-form">
            <div className="demo-disclaimer-banner">
              <ShieldAlert size={16} />
              <span>Demo environment — no real money moves.</span>
            </div>

            <div className="form-group">
              <label className="form-label">1. Choose Target Fund</label>
              <div className="fund-radio-grid">
                {funds.map((f) => {
                  const id = f.id || f._id;
                  return (
                    <label
                      key={id}
                      className={`fund-radio-card ${selectedFundId === id ? 'active' : ''}`}
                    >
                      <input
                        type="radio"
                        name="fundSelect"
                        value={id}
                        checked={selectedFundId === id}
                        onChange={() => setSelectedFundId(id)}
                      />
                      <span>{f.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">2. Select Amount (BDT ৳)</label>
              <div className="quick-amount-row">
                {quickAmounts.map((amt) => (
                  <button
                    type="button"
                    key={amt}
                    className={`amount-chip-btn ${amount === amt ? 'active' : ''}`}
                    onClick={() => { setAmount(amt); setCustomAmount(''); }}
                  >
                    ৳{parseInt(amt).toLocaleString()}
                  </button>
                ))}
                <button
                  type="button"
                  className={`amount-chip-btn ${amount === 'other' ? 'active' : ''}`}
                  onClick={() => setAmount('other')}
                >
                  Other
                </button>
              </div>

              {amount === 'other' && (
                <input
                  type="number"
                  required
                  placeholder="Enter custom amount in ৳"
                  className="form-input"
                  style={{ marginTop: '8px' }}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                />
              )}
            </div>

            <div className="form-group">
              <label className="form-label">3. Payment Method</label>
              <select
                className="form-input"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Mobile Wallet (bKash/Nagad)">Mobile Wallet (bKash / Nagad / Rocket)</option>
                <option value="Debit / Credit Card">Visa / MasterCard / AMEX</option>
                <option value="Bank Transfer">UIU Official Bank Wire Transfer</option>
              </select>
            </div>

            <div className="form-group">
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                />
                <span>Make this a recurring monthly gift</span>
              </label>

              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                />
                <span>Give anonymously (hide name on donor wall)</span>
              </label>
            </div>

            <Button type="submit" variant="accent" icon={Heart} fullWidth size="lg">
              Complete Donation
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
