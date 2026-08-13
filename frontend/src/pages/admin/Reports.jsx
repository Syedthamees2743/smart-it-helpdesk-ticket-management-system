import React, { useState } from 'react';
import { Card, Row, Col, Button, Spinner, Alert, Container } from 'react-bootstrap';
import {
  FaTicketAlt,
  FaUserTie,
  FaLaptop,
  FaStar,
  FaClock,
  FaFilePdf,
  FaDownload,
} from 'react-icons/fa';
import { FiAlertCircle } from 'react-icons/fi';
import reportService from '../../services/reportService';

const reports = [
  {
    id: 'tickets',
    title: 'All Tickets Report',
    description: 'Complete summary of all support tickets with status, priority, and assignment details.',
    icon: <FaTicketAlt />,
    endpoint: '/reports/tickets-pdf/',
    filename: 'all_tickets_report.pdf',
    color: '#4f46e5',
    bgColor: '#e0e7ff',
  },
  {
    id: 'technician',
    title: 'Technician Performance',
    description: 'Individual technician workload, resolved tickets count, and average feedback rating.',
    icon: <FaUserTie />,
    endpoint: '/reports/technician-performance-pdf/',
    filename: 'technician_performance_report.pdf',
    color: '#059669',
    bgColor: '#d1fae5',
  },
  {
    id: 'asset',
    title: 'Asset Report',
    description: 'Full inventory of IT assets including category, status, and current assignment.',
    icon: <FaLaptop />,
    endpoint: '/reports/asset-pdf/',
    filename: 'asset_report.pdf',
    color: '#7c3aed',
    bgColor: '#ede9fe',
  },
  {
    id: 'feedback',
    title: 'Feedback Report',
    description: 'All employee feedback with ratings, reviews, and associated tickets.',
    icon: <FaStar />,
    endpoint: '/reports/feedback-pdf/',
    filename: 'feedback_report.pdf',
    color: '#d97706',
    bgColor: '#fef3c7',
  },
  {
    id: 'sla',
    title: 'SLA Report',
    description: 'SLA deadline tracking showing met, breached, and pending status for all tickets.',
    icon: <FaClock />,
    endpoint: '/reports/sla-pdf/',
    filename: 'sla_report.pdf',
    color: '#dc2626',
    bgColor: '#fee2e2',
  },
];

const Reports = () => {
  const [downloading, setDownloading] = useState({});
  const [error, setError] = useState('');

  const handleDownload = async (report) => {
    setError('');
    setDownloading((prev) => ({ ...prev, [report.id]: true }));
    try {
      await reportService.downloadReport(report.endpoint, report.filename);
    } catch (err) {
      const errorMsg = err.response?.data?.error;
      if (typeof errorMsg === 'string') {
        setError(errorMsg);
      } else if (typeof errorMsg === 'object' && errorMsg !== null) {
        const firstKey = Object.keys(errorMsg)[0];
        setError(Array.isArray(errorMsg[firstKey]) ? errorMsg[firstKey][0] : errorMsg[firstKey]);
      } else {
        setError('Failed to generate report. Please try again.');
      }
    } finally {
      setDownloading((prev) => ({ ...prev, [report.id]: false }));
    }
  };

  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <h3 className="mb-1 fw-bold">Reports</h3>
        <p className="text-muted mb-0">
          Generate and download PDF reports for various system data.
        </p>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          <FiAlertCircle className="me-2" />
          {error}
          <span
            className="float-end"
            style={{ cursor: 'pointer' }}
            onClick={() => setError('')}
          >
            &times;
          </span>
        </Alert>
      )}

      <Row className="g-4">
        {reports.map((report) => (
          <Col md={6} lg={4} key={report.id}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="d-flex flex-column">
                <div className="d-flex align-items-start gap-3 mb-3">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: '52px',
                      height: '52px',
                      backgroundColor: report.bgColor,
                    }}
                  >
                    <span style={{ fontSize: '1.4rem', color: report.color }}>
                      {report.icon}
                    </span>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">{report.title}</h6>
                    <FaFilePdf style={{ color: '#ef4444', fontSize: '0.9rem' }} />
                    <span className="text-muted small ms-1">PDF Format</span>
                  </div>
                </div>

                <p className="text-muted small flex-grow-1" style={{ lineHeight: '1.6' }}>
                  {report.description}
                </p>

                <Button
                  variant="primary"
                  className="w-100 mt-2"
                  disabled={downloading[report.id]}
                  onClick={() => handleDownload(report)}
                >
                  {downloading[report.id] ? (
                    <>
                      <Spinner size="sm" className="me-1" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FaDownload className="me-1" />
                      Generate PDF
                    </>
                  )}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Reports;