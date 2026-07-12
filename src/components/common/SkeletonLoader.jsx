import PropTypes from 'prop-types';

/**
 * @typedef {'rectangle' | 'circle' | 'text' | 'text-sm'} SkeletonShape
 */

/**
 * @typedef {Object} SkeletonLoaderProps
 * @property {SkeletonShape} [shape='rectangle'] - The shape of the skeleton element
 * @property {string} [width] - Custom width (Tailwind class or inline style value)
 * @property {string} [height] - Custom height (Tailwind class or inline style value)
 * @property {number} [lines=1] - Number of text lines to render (only applies when shape is 'text' or 'text-sm')
 * @property {boolean} [animate=true] - Whether to show the shimmer animation
 * @property {string} [className] - Additional CSS classes to apply
 * @property {string} [ariaLabel='Loading...'] - Accessible label for screen readers
 */

/**
 * Reusable skeleton loader component with configurable shape, dimensions,
 * and shimmer animation. Used as a placeholder during data loading and
 * variant generation. Tailwind-styled with brand-aligned neutral colors.
 *
 * Shapes:
 * - 'rectangle': A rounded rectangle (default)
 * - 'circle': A circle
 * - 'text': A full-width text line placeholder
 * - 'text-sm': A 3/4-width smaller text line placeholder
 *
 * @param {SkeletonLoaderProps} props
 * @returns {React.ReactElement}
 */
function SkeletonLoader({
  shape = 'rectangle',
  width,
  height,
  lines = 1,
  animate = true,
  className,
  ariaLabel = 'Loading...',
}) {
  const baseClasses = animate
    ? 'relative overflow-hidden bg-neutral-200 rounded'
    : 'bg-neutral-200 rounded';

  const shimmerAfter = animate
    ? ' after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/40 after:to-transparent after:animate-[skeleton-shimmer_1.5s_ease-in-out_infinite]'
    : '';

  if ((shape === 'text' || shape === 'text-sm') && lines > 1) {
    const lineElements = [];
    for (let i = 0; i < lines; i++) {
      const isLast = i === lines - 1;
      const lineShape = isLast && shape === 'text' ? 'text-sm' : shape;
      lineElements.push(
        <SkeletonLine
          key={i}
          shape={lineShape}
          width={width}
          height={height}
          animate={animate}
          baseClasses={baseClasses}
          shimmerAfter={shimmerAfter}
        />,
      );
    }

    return (
      <div
        role="status"
        aria-busy="true"
        aria-label={ariaLabel}
        className={`flex flex-col space-y-2${className ? ` ${className}` : ''}`}
      >
        {lineElements}
        <span className="sr-only">{ariaLabel}</span>
      </div>
    );
  }

  const shapeClasses = getShapeClasses(shape, width, height);

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
      className={`${baseClasses}${shimmerAfter} ${shapeClasses}${className ? ` ${className}` : ''}`}
    >
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
}

/**
 * Returns Tailwind classes for the given skeleton shape.
 *
 * @param {SkeletonShape} shape - The skeleton shape
 * @param {string} [width] - Optional width class
 * @param {string} [height] - Optional height class
 * @returns {string} Tailwind class string
 */
function getShapeClasses(shape, width, height) {
  switch (shape) {
    case 'circle': {
      const size = width || 'w-10';
      const h = height || size.replace('w-', 'h-');
      return `${size} ${h} rounded-full`;
    }
    case 'text': {
      const w = width || 'w-full';
      const h = height || 'h-4';
      return `${w} ${h} rounded`;
    }
    case 'text-sm': {
      const w = width || 'w-3/4';
      const h = height || 'h-3';
      return `${w} ${h} rounded`;
    }
    case 'rectangle':
    default: {
      const w = width || 'w-full';
      const h = height || 'h-24';
      return `${w} ${h} rounded-lg`;
    }
  }
}

/**
 * Internal component for rendering a single skeleton text line.
 *
 * @param {Object} props
 * @param {SkeletonShape} props.shape
 * @param {string} [props.width]
 * @param {string} [props.height]
 * @param {boolean} props.animate
 * @param {string} props.baseClasses
 * @param {string} props.shimmerAfter
 * @returns {React.ReactElement}
 */
function SkeletonLine({ shape, width, height, animate, baseClasses, shimmerAfter }) {
  const shapeClasses = getShapeClasses(shape, width, height);

  return (
    <div
      aria-hidden="true"
      className={`${baseClasses}${shimmerAfter} ${shapeClasses}`}
    />
  );
}

SkeletonLine.propTypes = {
  shape: PropTypes.oneOf(['rectangle', 'circle', 'text', 'text-sm']).isRequired,
  width: PropTypes.string,
  height: PropTypes.string,
  animate: PropTypes.bool.isRequired,
  baseClasses: PropTypes.string.isRequired,
  shimmerAfter: PropTypes.string.isRequired,
};

SkeletonLine.defaultProps = {
  width: undefined,
  height: undefined,
};

SkeletonLoader.propTypes = {
  shape: PropTypes.oneOf(['rectangle', 'circle', 'text', 'text-sm']),
  width: PropTypes.string,
  height: PropTypes.string,
  lines: PropTypes.number,
  animate: PropTypes.bool,
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
};

SkeletonLoader.defaultProps = {
  shape: 'rectangle',
  width: undefined,
  height: undefined,
  lines: 1,
  animate: true,
  className: undefined,
  ariaLabel: 'Loading...',
};

export default SkeletonLoader;