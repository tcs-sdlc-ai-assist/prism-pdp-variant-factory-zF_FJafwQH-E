import { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Seeded mock Q&A data for demo purposes.
 * In production, this would be fetched from the Best Buy Q&A API.
 */
const MOCK_QA = [
  {
    id: 'qa-1',
    question: 'Does this product come with a warranty?',
    answer: 'Yes, this product includes a 1-year manufacturer warranty. Extended protection plans are available through Geek Squad.',
    votes: 42,
    date: '2024-11-15',
  },
  {
    id: 'qa-2',
    question: 'Is it compatible with my existing smart home setup?',
    answer: 'This product supports major smart home platforms including Amazon Alexa, Google Assistant, and Apple HomeKit. Check the compatibility section in the full specifications.',
    votes: 38,
    date: '2024-10-22',
  },
  {
    id: 'qa-3',
    question: 'What are the energy efficiency ratings?',
    answer: 'This product carries an ENERGY STAR certification and meets all current efficiency guidelines. Estimated annual energy cost is displayed on the product label.',
    votes: 27,
    date: '2024-09-10',
  },
  {
    id: 'qa-4',
    question: 'Can this be returned if I change my mind?',
    answer: 'Yes, Best Buy offers a 15-day return window for most electronics (30 days for My Best Buy Total members). Items must be in original packaging.',
    votes: 19,
    date: '2024-08-05',
  },
];

/**
 * Q&A section for the canonical PDP.
 * Shows seeded mock Q&A with upvote counts, expandable answers,
 * and a "Submit a question" placeholder. PRD §10.1 requirement.
 *
 * @param {{ diffHighlights?: object, showDiffOutline?: boolean, className?: string }} props
 * @returns {React.ReactElement}
 */
function QASection({ diffHighlights, showDiffOutline = false, className }) {
  const [expanded, setExpanded] = useState({});
  const [showAll, setShowAll] = useState(false);

  const displayed = showAll ? MOCK_QA : MOCK_QA.slice(0, 2);

  const toggleExpanded = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section
      role="region"
      aria-label="Customer questions and answers"
      className={`rounded-lg border border-neutral-200 bg-white p-6 shadow-sm animate-fade-in${className ? ` ${className}` : ''}`}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-neutral-900">
          Questions &amp; Answers
          <span className="ml-2 inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
            {MOCK_QA.length}
          </span>
        </h3>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100 transition-colors duration-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          aria-label="Ask a question about this product"
        >
          <svg
            className="h-3.5 w-3.5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Ask a Question
        </button>
      </div>

      {/* Q&A List */}
      <ul className="space-y-4" role="list">
        {displayed.map((qa) => (
          <li
            key={qa.id}
            className="border-b border-neutral-100 pb-4 last:border-0 last:pb-0"
          >
            <button
              type="button"
              className="w-full flex items-start gap-2 text-left focus:outline-none focus-visible:underline"
              onClick={() => toggleExpanded(qa.id)}
              aria-expanded={!!expanded[qa.id]}
            >
              <svg
                className="h-4 w-4 flex-shrink-0 text-primary-500 mt-0.5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
                />
              </svg>
              <span className="text-sm font-medium text-neutral-800 leading-snug">{qa.question}</span>
              <svg
                className={`ml-auto h-4 w-4 flex-shrink-0 text-neutral-400 transition-transform duration-200 ${expanded[qa.id] ? 'rotate-180' : ''}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {expanded[qa.id] && (
              <div className="mt-2 ml-6 animate-fade-in">
                <p className="text-sm text-neutral-600 leading-relaxed">{qa.answer}</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-xs text-neutral-400">
                    {new Date(qa.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-primary-600 transition-colors duration-200"
                    aria-label={`${qa.votes} people found this helpful`}
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904"
                      />
                    </svg>
                    Helpful ({qa.votes})
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Show more / less */}
      {MOCK_QA.length > 2 && (
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          className="mt-4 text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors duration-200 focus:outline-none focus-visible:underline"
        >
          {showAll ? 'Show fewer questions' : `Show all ${MOCK_QA.length} questions`}
        </button>
      )}
    </section>
  );
}

QASection.propTypes = {
  diffHighlights: PropTypes.shape({
    dimensions: PropTypes.arrayOf(PropTypes.string),
    fields: PropTypes.arrayOf(PropTypes.string),
    hasChanges: PropTypes.bool,
  }),
  showDiffOutline: PropTypes.bool,
  className: PropTypes.string,
};

QASection.defaultProps = {
  diffHighlights: undefined,
  showDiffOutline: false,
  className: undefined,
};

export default QASection;
