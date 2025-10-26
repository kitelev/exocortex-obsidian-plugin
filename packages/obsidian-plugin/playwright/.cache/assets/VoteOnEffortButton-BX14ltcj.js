import { j as jsxRuntimeExports } from './jsx-runtime-KAobzw4c.js';
import { R as React } from './index-BIdHmUZ9.js';
import { j as canVoteOnEffort } from './index-BFV2YJKW.js';

"use strict";
const VoteOnEffortButton = ({
  instanceClass,
  metadata,
  isArchived,
  sourceFile,
  onVote
}) => {
  const shouldShowButton = React.useMemo(() => {
    const context = {
      instanceClass,
      currentStatus: null,
      metadata,
      isArchived,
      currentFolder: sourceFile.parent?.path || "",
      expectedFolder: null
    };
    return canVoteOnEffort(context);
  }, [instanceClass, metadata, isArchived, sourceFile]);
  const currentVotes = React.useMemo(() => {
    const votes = metadata?.ems__Effort_votes;
    if (typeof votes === "number") {
      return votes;
    }
    return 0;
  }, [metadata]);
  const handleClick = async (e) => {
    e.preventDefault();
    await onVote();
  };
  if (!shouldShowButton) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      className: "exocortex-vote-btn",
      onClick: handleClick,
      type: "button",
      title: `Vote on this effort (current votes: ${currentVotes})`,
      children: currentVotes > 0 ? `Vote (${currentVotes})` : "Vote"
    }
  );
};

export { VoteOnEffortButton };
//# sourceMappingURL=VoteOnEffortButton-BX14ltcj.js.map
