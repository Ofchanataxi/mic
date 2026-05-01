const { env } = require("../config/env");
const { candidateRepository } = require("../repositories/candidateRepository");
const { ApiError } = require("../utils/apiError");
const { SkillType } = require("../utils/constants");

class AdaptiveStrategyService {
  async generateStrategy({ userId, questionCount, targetRole, level }) {
    const profile = await candidateRepository.findSubtopicsForStrategy(userId);

    if (!profile) {
      throw new ApiError(404, "Candidate profile not found");
    }

    const technical = profile.subtopics.filter((subtopic) => subtopic.skillType === SkillType.TECHNICAL);
    const soft = profile.subtopics.filter((subtopic) => subtopic.skillType === SkillType.SOFT);
    const softTargetCount = Math.min(
      soft.length,
      Math.floor(questionCount * env.adaptiveSoftSkillsRatio)
    );
    const technicalTargetCount = questionCount - softTargetCount;

    const plan = [];

    this.appendSelected(plan, this.selectSubtopics(technical, technicalTargetCount));
    this.appendSelected(plan, this.selectSubtopics(soft, softTargetCount));

    if (plan.length < questionCount) {
      const remaining = [...technical, ...soft];
      this.appendSelected(plan, this.selectSubtopics(remaining, questionCount - plan.length, true));
    }

    const ordered = this.avoidConsecutiveTopics(plan).slice(0, questionCount);

    return {
      userId: profile.userId,
      candidateProfileId: profile.id,
      questionCount,
      targetRole: targetRole || profile.targetRole,
      level: level || profile.estimatedSeniority,
      evaluationPlan: ordered.map((item, index) => ({
        candidateTopicId: item.candidateTopicId,
        candidateSubtopicId: item.id,
        skillType: item.skillType,
        topic: item.candidateTopic.name,
        subtopic: item.name,
        expectedLevel: item.expectedLevel,
        priority: index + 1,
        reason: this.reasonFor(item)
      }))
    };
  }

  selectSubtopics(subtopics, count, allowReuse = false) {
    if (count <= 0 || subtopics.length === 0) {
      return [];
    }

    const notEvaluated = subtopics
      .filter((subtopic) => subtopic.usageCount === 0)
      .sort(this.coverageSort);
    const weak = subtopics
      .filter((subtopic) => subtopic.usageCount > 0 && subtopic.averageScore !== null && subtopic.averageScore < env.adaptiveWeakScoreThreshold)
      .sort(this.weakSort);
    const coverageCount = Math.ceil(count * env.adaptiveCoverageRatio);
    const reinforcementCount = count - coverageCount;

    const selected = [];
    this.takeInto(selected, notEvaluated, coverageCount);
    this.takeInto(selected, weak, reinforcementCount);

    const selectedIds = new Set(selected.map((subtopic) => subtopic.id));
    const rest = subtopics
      .filter((subtopic) => !selectedIds.has(subtopic.id))
      .sort(this.generalSort);
    this.takeInto(selected, rest, count - selected.length);

    while (allowReuse && selected.length < count) {
      const reusable = [...subtopics].sort(this.generalSort);
      if (reusable.length === 0) {
        break;
      }
      selected.push(reusable[selected.length % reusable.length]);
    }

    return selected.slice(0, count);
  }

  appendSelected(plan, selected) {
    for (const item of selected) {
      plan.push(item);
    }
  }

  takeInto(target, source, count) {
    let added = 0;

    for (const item of source) {
      if (added >= count) {
        return;
      }

      if (!target.some((selected) => selected.id === item.id)) {
        target.push(item);
        added += 1;
      }
    }
  }

  avoidConsecutiveTopics(items) {
    const pending = [...items];
    const result = [];

    while (pending.length > 0) {
      const lastTopicId = result.length > 0 ? result[result.length - 1].candidateTopicId : null;
      const index = pending.findIndex((item) => item.candidateTopicId !== lastTopicId);
      const selectedIndex = index === -1 ? 0 : index;
      result.push(pending.splice(selectedIndex, 1)[0]);
    }

    return result;
  }

  reasonFor(subtopic) {
    if (subtopic.usageCount === 0) {
      return "Not evaluated yet / coverage";
    }

    if (subtopic.averageScore !== null && subtopic.averageScore < env.adaptiveWeakScoreThreshold) {
      return "Weak score / reinforcement";
    }

    if (subtopic.reinforce) {
      return "Marked for reinforcement";
    }

    return "Coverage balance / lower usage count";
  }

  coverageSort(a, b) {
    return b.priority - a.priority || a.candidateTopic.usageCount - b.candidateTopic.usageCount || a.name.localeCompare(b.name);
  }

  weakSort(a, b) {
    return a.averageScore - b.averageScore || a.usageCount - b.usageCount || b.priority - a.priority;
  }

  generalSort(a, b) {
    return a.usageCount - b.usageCount || Number(b.reinforce) - Number(a.reinforce) || b.priority - a.priority || a.name.localeCompare(b.name);
  }
}

const adaptiveStrategyService = new AdaptiveStrategyService();

module.exports = {
  adaptiveStrategyService
};
