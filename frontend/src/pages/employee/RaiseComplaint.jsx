import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Button,
  Spinner,
  Alert,
  Row,
  Col,
  Badge
} from 'react-bootstrap';

import { useNavigate } from 'react-router-dom';

import {
  FaTicketAlt,
  FaTag,
  FaHeading,
  FaAlignLeft,
  FaFlag,
  FaImage,
  FaPaperPlane,
  FaExclamationTriangle,
  FaMagic,
  FaRobot,
  FaTimes,
  FaCheck,
  FaBook
} from 'react-icons/fa';

import { createTicket } from '../../services/ticketService';
import { getCategories } from '../../services/categoryService';
import aiService from '../../services/aiService';


const RaiseComplaint = () => {

  const navigate = useNavigate();

  // =====================================================
  // STATES
  // =====================================================

  const [categories, setCategories] = useState([]);

  const [categoryLoading, setCategoryLoading] = useState(true);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  const [fileName, setFileName] = useState('');


  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    priority: 'medium',
    screenshot: null
  });


  // =====================================================
  // AI STATES
  // =====================================================

  const [aiLoading, setAiLoading] = useState(false);

  const [aiResult, setAiResult] = useState(null);

  const [aiError, setAiError] = useState('');


  // =====================================================
  // LOAD ALL CATEGORIES
  // =====================================================

  useEffect(() => {

    const loadAllCategories = async () => {

      setCategoryLoading(true);

      try {

        let allCategories = [];

        let page = 1;

        let hasNextPage = true;


        while (hasNextPage) {

          const response = await getCategories({
            page: page,
            page_size: 100
          });


          const data = response?.data;


          // -------------------------------------------------
          // CASE 1:
          // Paginated response
          // {
          //   count: 10,
          //   next: "...",
          //   previous: null,
          //   results: [...]
          // }
          // -------------------------------------------------

          if (data && Array.isArray(data.results)) {

            allCategories = [
              ...allCategories,
              ...data.results
            ];


            if (data.next) {

              page += 1;

            } else {

              hasNextPage = false;

            }

          }

          // -------------------------------------------------
          // CASE 2:
          // Direct array response
          // [...]
          // -------------------------------------------------

          else if (Array.isArray(data)) {

            allCategories = data;

            hasNextPage = false;

          }

          // -------------------------------------------------
          // CASE 3:
          // Unexpected response
          // -------------------------------------------------

          else {

            console.error(
              'Unexpected category API response:',
              data
            );

            hasNextPage = false;

          }

        }


        // -------------------------------------------------
        // REMOVE DUPLICATES
        // -------------------------------------------------

        const uniqueCategories = Array.from(
          new Map(
            allCategories.map(category => [
              category.id,
              category
            ])
          ).values()
        );


        // -------------------------------------------------
        // SORT BY ID
        // -------------------------------------------------

        uniqueCategories.sort(
          (a, b) => Number(a.id) - Number(b.id)
        );


        console.log(
          'ALL CATEGORIES FROM DATABASE:',
          uniqueCategories
        );


        setCategories(uniqueCategories);

      } catch (err) {

        console.error(
          'Failed to load categories:',
          err
        );

        setCategories([]);

      } finally {

        setCategoryLoading(false);

      }

    };


    loadAllCategories();

  }, []);


  // =====================================================
  // HANDLE FORM CHANGE
  // =====================================================

  const handleChange = (e) => {

    const {
      name,
      value,
      files
    } = e.target;


    if (files && files[0]) {

      setFileName(files[0].name);

    } else if (name === 'screenshot') {

      setFileName('');

    }


    setFormData(prev => ({
      ...prev,
      [name]: files
        ? files[0]
        : value
    }));


    // Clear AI result when manually changing
    // category or priority

    if (
      name === 'category' ||
      name === 'priority'
    ) {

      setAiResult(null);

    }

  };


  // =====================================================
  // AI ANALYZE
  // =====================================================

  const handleAnalyze = async () => {

    if (
      !formData.title.trim() ||
      !formData.description.trim()
    ) {

      setAiError(
        'Please enter both title and description before analyzing.'
      );

      return;

    }


    setAiLoading(true);

    setAiError('');

    setAiResult(null);


    try {

      const response =
        await aiService.analyzeComplaint({
          title: formData.title,
          description: formData.description
        });


      if (
        response.success &&
        response.data
      ) {

        setAiResult(response.data);

      } else {

        setAiError(
          response.error ||
          'AI analysis failed. Please select manually.'
        );

      }

    } catch (err) {

      if (err.response?.data?.error) {

        const errorMessage =
          err.response.data.error;

        setAiError(
          typeof errorMessage === 'string'
            ? errorMessage
            : 'AI analysis failed.'
        );

      } else if (!err.response) {

        setAiError(
          'Network error. Please check your connection.'
        );

      } else {

        setAiError(
          'AI assistance is currently unavailable. You can continue using the system normally.'
        );

      }

    } finally {

      setAiLoading(false);

    }

  };


  // =====================================================
  // ACCEPT AI SUGGESTION
  // =====================================================

  const handleAcceptSuggestion = () => {

    if (!aiResult) return;


    setFormData(prev => ({
      ...prev,

      category:
        aiResult.suggested_category_id || '',

      priority:
        aiResult.suggested_priority || 'medium'

    }));


    setAiResult(null);

    setAiError('');

  };


  // =====================================================
  // DISMISS AI
  // =====================================================

  const handleDismissAi = () => {

    setAiResult(null);

    setAiError('');

  };


  // =====================================================
  // SUBMIT TICKET
  // =====================================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    setLoading(true);

    setError('');


    // Validate category

    if (!formData.category) {

      setError(
        'Please select an issue category.'
      );

      setLoading(false);

      return;

    }


    const data = new FormData();


    data.append(
      'category',
      formData.category
    );

    data.append(
      'title',
      formData.title
    );

    data.append(
      'description',
      formData.description
    );

    data.append(
      'priority',
      formData.priority
    );


    if (formData.screenshot) {

      data.append(
        'screenshot',
        formData.screenshot
      );

    }


    try {

      await createTicket(data);

      navigate('/employee/tickets');

    } catch (err) {

      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Failed to raise complaint.';


      setError(
        typeof errMsg === 'string'
          ? errMsg
          : JSON.stringify(errMsg)
      );

    } finally {

      setLoading(false);

    }

  };


  // =====================================================
  // PRIORITY OPTIONS
  // =====================================================

  const priorityOptions = [

    {
      value: 'low',
      label: 'Low',
      color: '#22c55e',
      desc: 'Minor issue, no urgency'
    },

    {
      value: 'medium',
      label: 'Medium',
      color: '#3b82f6',
      desc: 'Normal priority'
    },

    {
      value: 'high',
      label: 'High',
      color: '#f59e0b',
      desc: 'Urgent, affects work'
    },

    {
      value: 'critical',
      label: 'Critical',
      color: '#dc2626',
      desc: 'System down, immediate action'
    }

  ];


  // =====================================================
  // PRIORITY COLOR
  // =====================================================

  const getPriorityColor = (priority) => {

    const found =
      priorityOptions.find(
        option =>
          option.value === priority
      );


    return found
      ? found.color
      : '#6b7280';

  };


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div>

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-4">

        <h4 className="fw-bold mb-1">

          <FaTicketAlt
            className="me-2 text-primary"
          />

          Raise Complaint

        </h4>


        <p className="text-muted mb-0">

          Submit a new IT support request.

        </p>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <Alert
          variant="danger"
          className="d-flex align-items-center mb-4"
          dismissible
          onClose={() => setError('')}
        >

          <FaExclamationTriangle
            className="me-2 flex-shrink-0"
          />

          <div>
            {error}
          </div>

        </Alert>

      )}


      <Row className="g-4">


        {/* =================================================
            MAIN FORM
        ================================================= */}

        <Col lg={8}>

          <Card className="border-0 shadow-sm">

            <Card.Body className="p-4">

              <Form
                onSubmit={handleSubmit}
                noValidate
              >


                {/* =================================================
                    TITLE
                ================================================= */}

                <Form.Group className="mb-3">

                  <Form.Label
                    className="fw-semibold mb-1"
                  >

                    <FaHeading
                      className="me-1 text-primary"
                    />

                    Title

                    <span className="text-danger">
                      *
                    </span>

                  </Form.Label>


                  <Form.Control
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Brief summary of the issue"
                    required
                    className="py-2"
                  />

                </Form.Group>


                {/* =================================================
                    DESCRIPTION
                ================================================= */}

                <Form.Group className="mb-3">

                  <Form.Label
                    className="fw-semibold mb-1"
                  >

                    <FaAlignLeft
                      className="me-1 text-primary"
                    />

                    Description

                    <span className="text-danger">
                      *
                    </span>

                  </Form.Label>


                  <Form.Control
                    as="textarea"
                    rows={6}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Explain the issue in detail — what happened, when it started, any error messages, steps you've already tried..."
                    required
                    className="py-2"
                    style={{
                      resize: 'vertical'
                    }}
                  />

                </Form.Group>


                {/* =================================================
                    AI ANALYZE
                ================================================= */}

                <div className="mb-3">

                  <Button
                    type="button"
                    variant="outline-primary"
                    onClick={handleAnalyze}
                    disabled={
                      aiLoading ||
                      loading
                    }
                    className="rounded-3 px-3 py-2"
                  >

                    {aiLoading ? (

                      <>

                        <Spinner
                          size="sm"
                          className="me-2"
                        />

                        Analyzing...

                      </>

                    ) : (

                      <>

                        <FaMagic
                          className="me-2"
                        />

                        Analyze Complaint

                      </>

                    )}

                  </Button>


                  <small className="text-muted ms-2">

                    AI suggests category & priority

                  </small>

                </div>


                {/* =================================================
                    AI ERROR
                ================================================= */}

                {aiError && (

                  <Alert
                    variant="warning"
                    className="d-flex align-items-start py-2 mb-3"
                    dismissible
                    onClose={() =>
                      setAiError('')
                    }
                  >

                    <FaRobot
                      className="me-2 mt-1 flex-shrink-0"
                    />

                    <div>

                      <div className="fw-semibold small">

                        AI Analysis Unavailable

                      </div>


                      <div className="small mb-0">

                        {aiError}

                      </div>

                    </div>

                  </Alert>

                )}


                {/* =================================================
                    AI RESULT
                ================================================= */}

                {aiResult && (

                  <div
                    className="border rounded-3 p-3 mb-3"
                    style={{
                      backgroundColor: '#f0f9ff',
                      borderColor: '#bae6fd',
                      borderLeft:
                        '4px solid #0ea5e9'
                    }}
                  >

                    <div className="d-flex align-items-center mb-2">

                      <FaMagic
                        className="me-2 text-primary"
                      />

                      <span
                        className="fw-bold"
                        style={{
                          fontSize: '0.9rem'
                        }}
                      >

                        AI Suggestion

                      </span>

                    </div>


                    <Row className="g-2 mb-2">

                      <Col xs="auto">

                        <div className="text-muted small">
                          Suggested Category
                        </div>


                        {aiResult.suggested_category ? (

                          <Badge
                            bg="primary"
                            className="px-3 py-1 mt-1"
                            style={{
                              fontSize: '0.85rem'
                            }}
                          >

                            {
                              aiResult.suggested_category
                            }

                          </Badge>

                        ) : (

                          <div className="text-muted small mt-1">
                            —
                          </div>

                        )}

                      </Col>


                      <Col xs="auto">

                        <div className="text-muted small">
                          Suggested Priority
                        </div>


                        {aiResult.suggested_priority && (

                          <Badge
                            className="px-3 py-1 mt-1"
                            style={{
                              fontSize: '0.85rem',
                              backgroundColor:
                                getPriorityColor(
                                  aiResult.suggested_priority
                                ),
                              color: '#fff'
                            }}
                          >

                            {
                              aiResult
                                .suggested_priority
                                .charAt(0)
                                .toUpperCase() +
                              aiResult
                                .suggested_priority
                                .slice(1)
                            }

                          </Badge>

                        )}

                      </Col>

                    </Row>


                    {aiResult.reason && (

                      <div
                        className="text-muted small mb-2"
                        style={{
                          fontStyle: 'italic'
                        }}
                      >

                        "{aiResult.reason}"

                      </div>

                    )}


                    {aiResult.related_faqs &&
                      aiResult.related_faqs.length > 0 && (

                        <div className="mb-2">

                          <div className="small fw-semibold mb-1">

                            <FaBook className="me-1" />

                            Related Knowledge Base Articles

                          </div>


                          {aiResult.related_faqs.map(
                            (faq, index) => (

                              <div
                                key={
                                  faq.id || index
                                }
                                className="small text-primary mb-1"
                                style={{
                                  cursor: 'pointer'
                                }}
                                onClick={() =>
                                  navigate(
                                    '/employee/faqs'
                                  )
                                }
                              >

                                • {faq.question}

                              </div>

                            )
                          )}

                        </div>

                      )}


                    <div
                      className="d-flex gap-2 align-items-center pt-2 border-top"
                      style={{
                        borderColor: '#bae6fd'
                      }}
                    >

                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={
                          handleAcceptSuggestion
                        }
                        className="rounded-pill px-3"
                      >

                        <FaCheck className="me-1" />

                        Accept Suggestion

                      </Button>


                      <Button
                        type="button"
                        size="sm"
                        variant="outline-secondary"
                        onClick={
                          handleDismissAi
                        }
                        className="rounded-pill px-3"
                      >

                        <FaTimes className="me-1" />

                        Dismiss

                      </Button>


                      <small
                        className="text-muted ms-auto"
                        style={{
                          fontSize: '0.72rem'
                        }}
                      >

                        AI-generated — verify before submitting

                      </small>

                    </div>

                  </div>

                )}


                {/* =================================================
                    CATEGORY + PRIORITY
                ================================================= */}

                <Row className="g-3 mb-3">


                  {/* CATEGORY */}

                  <Col md={6}>

                    <Form.Group>

                      <Form.Label
                        className="fw-semibold mb-1"
                      >

                        <FaTag
                          className="me-1 text-primary"
                        />

                        Category

                        <span className="text-danger">
                          *
                        </span>

                      </Form.Label>


                      <Form.Select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        disabled={categoryLoading}
                        className="py-2"
                      >

                        <option value="">

                          {categoryLoading
                            ? 'Loading categories...'
                            : 'Select Category'}

                        </option>


                        {categories.map(
                          category => (

                            <option
                              key={category.id}
                              value={category.id}
                            >

                              {category.name}

                            </option>

                          )
                        )}

                      </Form.Select>


                      {/* Debug count - remove later if needed */}

                      {!categoryLoading &&
                        categories.length > 0 && (

                          <small className="text-muted">
                            {categories.length} categories available
                          </small>

                        )}

                    </Form.Group>

                  </Col>


                  {/* PRIORITY */}

                  <Col md={6}>

                    <Form.Group>

                      <Form.Label
                        className="fw-semibold mb-1"
                      >

                        <FaFlag
                          className="me-1 text-primary"
                        />

                        Priority

                      </Form.Label>


                      <Form.Select
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        className="py-2"
                      >

                        {priorityOptions.map(
                          priority => (

                            <option
                              key={priority.value}
                              value={priority.value}
                            >

                              {priority.label}
                              {' — '}
                              {priority.desc}

                            </option>

                          )
                        )}

                      </Form.Select>

                    </Form.Group>

                  </Col>

                </Row>


                {/* =================================================
                    FILE UPLOAD
                ================================================= */}

                <Form.Group className="mb-4">

                  <Form.Label
                    className="fw-semibold mb-1"
                  >

                    <FaImage
                      className="me-1 text-primary"
                    />

                    Screenshot / Attachment

                  </Form.Label>


                  <div
                    className="border border-dashed rounded-3 p-4 text-center"
                    style={{
                      borderColor:
                        fileName
                          ? '#22c55e'
                          : '#cbd5e1',

                      backgroundColor:
                        fileName
                          ? '#f0fdf4'
                          : '#f8fafc',

                      cursor: 'pointer',

                      transition:
                        'all 0.2s'
                    }}
                    onClick={() =>
                      document
                        .getElementById(
                          'screenshot-input'
                        )
                        .click()
                    }
                  >

                    <input
                      id="screenshot-input"
                      type="file"
                      name="screenshot"
                      onChange={handleChange}
                      accept="image/*,.pdf"
                      style={{
                        display: 'none'
                      }}
                    />


                    {fileName ? (

                      <div>

                        <FaImage
                          className="text-success mb-2"
                          style={{
                            fontSize: '1.5rem'
                          }}
                        />

                        <div className="fw-medium text-success">
                          {fileName}
                        </div>

                        <small className="text-muted">
                          Click to change
                        </small>

                      </div>

                    ) : (

                      <div>

                        <FaImage
                          className="text-muted mb-2"
                          style={{
                            fontSize: '1.5rem'
                          }}
                        />

                        <div className="text-muted">
                          Click to upload screenshot or PDF
                        </div>

                        <small className="text-muted">
                          Accepted: Images, PDF
                        </small>

                      </div>

                    )}

                  </div>

                </Form.Group>


                {/* =================================================
                    BUTTONS
                ================================================= */}

                <div className="d-flex justify-content-end gap-2">

                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={() =>
                      navigate(
                        '/employee/tickets'
                      )
                    }
                    className="px-4 py-2"
                  >

                    Cancel

                  </Button>


                  <Button
                    variant="primary"
                    type="submit"
                    disabled={
                      loading ||
                      categoryLoading
                    }
                    className="px-4 py-2 rounded-3 shadow-sm"
                  >

                    {loading ? (

                      <>

                        <Spinner
                          size="sm"
                          className="me-2"
                        />

                        Submitting...

                      </>

                    ) : (

                      <>

                        <FaPaperPlane
                          className="me-2"
                        />

                        Submit Complaint

                      </>

                    )}

                  </Button>

                </div>

              </Form>

            </Card.Body>

          </Card>

        </Col>


        {/* =================================================
            SIDE PANEL
        ================================================= */}

        <Col lg={4}>

          {/* TIPS */}

          <Card className="border-0 shadow-sm mb-3">

            <Card.Body className="p-4">

              <h6 className="fw-bold mb-3">
                💡 Tips for a Good Ticket
              </h6>


              <ul className="list-unstyled mb-0 small">

                {[
                  'Be specific in the title — avoid "Help needed"',
                  'Include error messages or codes if any',
                  'Mention when the issue started',
                  "List steps you've already tried",
                  'Attach screenshots if possible'
                ].map(
                  (tip, index) => (

                    <li
                      key={index}
                      className="d-flex mb-2"
                    >

                      <span className="text-primary me-2 fw-bold">
                        ✓
                      </span>

                      <span className="text-muted">
                        {tip}
                      </span>

                    </li>

                  )
                )}

              </ul>

            </Card.Body>

          </Card>


          {/* PRIORITY GUIDE */}

          <Card className="border-0 shadow-sm mb-3">

            <Card.Body className="p-4">

              <h6 className="fw-bold mb-3">
                🚨 Priority Guide
              </h6>


              {priorityOptions.map(
                priority => (

                  <div
                    key={priority.value}
                    className="d-flex align-items-start mb-3"
                  >

                    <span
                      className="rounded-circle me-2 mt-1 flex-shrink-0"
                      style={{
                        width: 10,
                        height: 10,
                        backgroundColor:
                          priority.color
                      }}
                    />


                    <div>

                      <div
                        className="fw-medium"
                        style={{
                          fontSize: '0.85rem'
                        }}
                      >

                        {priority.label}

                      </div>


                      <div
                        className="text-muted"
                        style={{
                          fontSize: '0.78rem'
                        }}
                      >

                        {priority.desc}

                      </div>

                    </div>

                  </div>

                )
              )}

            </Card.Body>

          </Card>


          {/* FAQ */}

          <Card className="border-0 shadow-sm bg-primary bg-opacity-10">

            <Card.Body className="p-4 text-center">

              <h6 className="fw-bold mb-2">
                Check FAQs First
              </h6>


              <p className="text-muted small mb-3">

                Many common issues have solutions in our Knowledge Base.

              </p>


              <Button
                variant="outline-primary"
                size="sm"
                className="w-100 rounded-pill"
                onClick={() =>
                  navigate(
                    '/employee/faqs'
                  )
                }
              >

                View FAQs

              </Button>

            </Card.Body>

          </Card>

        </Col>

      </Row>

    </div>

  );

};


export default RaiseComplaint;