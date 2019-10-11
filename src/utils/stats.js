import { QUESTIONS } from '../constants';
import { getId } from './jsonld';
import { getAnswerMap } from './actions';

function isYes(textOrAnswer) {
  const text =
    typeof textOrAnswer === 'string'
      ? textOrAnswer
      : textOrAnswer
      ? textOrAnswer.text
      : '';

  return (text || '').toLowerCase().trim() === 'yes';
}

function isNo(textOrAnswer) {
  const text =
    typeof textOrAnswer === 'string'
      ? textOrAnswer
      : textOrAnswer
      ? textOrAnswer.text
      : '';

  return (text || '').toLowerCase().trim() === 'no';
}

function isNa(textOrAnswer) {
  const text =
    typeof textOrAnswer === 'string'
      ? textOrAnswer
      : textOrAnswer
      ? textOrAnswer.text
      : '';

  return (text || '').toLowerCase().trim() === 'n.a.';
}

function isUnsure(textOrAnswer) {
  const text =
    typeof textOrAnswer === 'string'
      ? textOrAnswer
      : textOrAnswer
      ? textOrAnswer.text
      : '';

  return (text || '').toLowerCase().trim() === 'unsure';
}

/**
 * Tags are computed following a majority rule
 */
export function getTags(actions) {
  const hasReviews = actions.some(
    action => action['@type'] === 'RapidPREreviewAction'
  );

  const hasRequests = actions.some(
    action => action['@type'] === 'RequestForRapidPREreviewAction'
  );

  const reviewActions = actions.filter(
    action => action['@type'] === 'RapidPREreviewAction'
  );

  const threshold = Math.ceil(reviewActions.length / 2);

  // hasData
  const reviewsWithData = reviewActions.filter(action => {
    if (action.resultReview && action.resultReview.reviewAnswer) {
      const answers = action.resultReview.reviewAnswer;

      for (let i = 0; i < answers.length; i++) {
        const answer = answers[i];
        if (answer.parentItem) {
          const questionId = getId(answer.parentItem);
          if (questionId === 'question:ynAvailableData') {
            return isYes(answer);
          }
        }
      }
    }
    return false;
  });

  const hasData = reviewsWithData.length >= threshold;

  // hasCode
  const reviewsWithCode = reviewActions.filter(action => {
    if (action.resultReview && action.resultReview.reviewAnswer) {
      const answers = action.resultReview.reviewAnswer;

      for (let i = 0; i < answers.length; i++) {
        const answer = answers[i];
        if (answer.parentItem) {
          const questionId = getId(answer.parentItem);
          if (questionId === 'question:ynAvailableCode') {
            return isYes(answer);
          }
        }
      }
    }
    return false;
  });

  const hasCode = reviewsWithCode.length >= threshold;

  // subjects
  const subjectCountMap = {};
  reviewActions.forEach(action => {
    if (action.resultReview && action.resultReview.about) {
      action.resultReview.about.forEach(subject => {
        if (typeof subject.name === 'string') {
          if (subject.name in subjectCountMap) {
            subjectCountMap[subject.name] += 1;
          } else {
            subjectCountMap[subject.name] = 1;
          }
        }
      });
    }
  });

  const subjects = Object.keys(subjectCountMap).filter(subjectName => {
    const count = subjectCountMap[subjectName];
    return count >= threshold;
  });

  return { hasReviews, hasRequests, hasData, hasCode, subjects };
}

export function getYesNoStats(actions = []) {
  const pairs = actions
    .filter(action => action['@type'] === 'RapidPREreviewAction')
    .map(action => {
      return {
        roleId: getId(action.agent),
        answerMap: getAnswerMap(action)
      };
    });

  const nReviews = pairs.length;

  return QUESTIONS.filter(({ type }) => type === 'YesNoQuestion').map(
    ({ identifier, type, question }) => {
      return {
        questionId: `question:${identifier}`,
        nReviews,
        question,
        yes: pairs
          .filter(({ answerMap }) => {
            return isYes(answerMap[identifier]);
          })
          .map(({ roleId }) => roleId),
        no: pairs
          .filter(({ answerMap }) => {
            return isNo(answerMap[identifier]);
          })
          .map(({ roleId }) => roleId),
        na: pairs
          .filter(({ answerMap }) => {
            return isNa(answerMap[identifier]);
          })
          .map(({ roleId }) => roleId),
        unsure: pairs
          .filter(({ answerMap }) => {
            return isUnsure(answerMap[identifier]);
          })
          .map(({ roleId }) => roleId)
      };
    }
  );
}

export function getTextAnswers(actions = []) {
  const pairs = actions
    .filter(action => action['@type'] === 'RapidPREreviewAction')
    .map(action => {
      return {
        roleId: getId(action.agent),
        answerMap: getAnswerMap(action)
      };
    });

  return QUESTIONS.filter(({ type }) => {
    return type === 'Question';
  }).map(({ question, identifier }) => {
    return {
      questionId: `question:${identifier}`,
      question,
      answers: pairs.map(({ roleId, answerMap }) => {
        return {
          roleId,
          text: answerMap[identifier]
        };
      })
    };
  });
}
