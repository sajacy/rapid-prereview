import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import ScoreBadge from './score-badge';

export default { title: 'AnimatedScore' };

const actions = Array.from({ length: 10 }, (_, i) => {
  return {
    '@type':
      Math.random() <= 0.5
        ? 'RapidPREreviewAction'
        : 'RequestForRapidPREreviewAction',
    startTime: new Date(new Date().getTime() - i * 1000 * 60 * 60).toISOString()
  };
});

export function Demo() {
  return <AnimatedScore actions={actions} />;
}

function AnimatedScore({ actions }) {
  const sorted = useMemo(() => {
    return actions.slice().sort((a, b) => {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
  }, [actions]);

  const [index, setIndex] = useState(null);

  useEffect(() => {
    if (index !== null && index < sorted.length - 1) {
      const totalAnimTime = 600;

      const tmin = new Date(sorted[0].startTime).getTime();
      const tmax = new Date(sorted[sorted.length - 1].startTime).getTime();

      const t = new Date(sorted[Math.max(index, 0)].startTime).getTime();
      const nextT = new Date(
        sorted[Math.max(index + 1, 0)].startTime
      ).getTime();

      const rT = ((t - tmin) / (tmax - tmin)) * totalAnimTime;
      const rNextT = ((nextT - tmin) / (tmax - tmin)) * totalAnimTime;
      const timeout = rNextT - rT;

      const timeoutId = setTimeout(() => {
        setIndex(index + 1);
      }, timeout);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [index, sorted]);

  function handleStartAnim() {
    setIndex(-1);
  }
  function handleStopAnim() {
    setIndex(null);
  }

  const nRequests =
    index === -1
      ? 0
      : getNRequests(
          sorted.slice(0, index === null ? actions.length : index + 1)
        );
  const nReviews =
    index === -1
      ? 0
      : getNReviews(
          sorted.slice(0, index === null ? actions.length : index + 1)
        );
  return (
    <div
      onMouseEnter={handleStartAnim}
      onMouseLeave={handleStopAnim}
      style={{ display: 'flex', alignItems: 'center' }}
    >
      <ScoreBadge
        now={
          index === null
            ? undefined
            : index === -1
            ? sorted[0].startTime
            : sorted[index].startTime
        }
        nRequests={nRequests}
        nReviews={nReviews}
        dateFirstActivity={sorted[0].startTime}
      />
      <span style={{ marginLeft: '4px' }}>
        reviews {nReviews} + requests {nRequests}
      </span>
    </div>
  );
}

AnimatedScore.propTypes = {
  actions: PropTypes.array
};

function getNReviews(actions) {
  return actions.reduce((count, action) => {
    if (action['@type'] === 'RapidPREreviewAction') {
      count++;
    }
    return count;
  }, 0);
}

function getNRequests(actions) {
  return actions.reduce((count, action) => {
    if (action['@type'] === 'RequestForRapidPREreviewAction') {
      count++;
    }
    return count;
  }, 0);
}