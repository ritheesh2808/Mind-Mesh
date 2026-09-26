import re
from typing import List, Dict, Any, Set, Optional
from backend.schemas import DiscussionIntelligenceItem

class DiscussionEngine:
    """
    Deterministic discussion intelligence engine.
    Analyzes debate divergence, vote distribution, unresolved questions,
    and consensus status without LLM dependencies.
    """

    @classmethod
    def analyze_discussions(
        cls,
        discussions: List[Dict[str, Any]],
        messages: Optional[List[Dict[str, Any]]] = None,
        viewpoints: Optional[List[Dict[str, Any]]] = None,
        decisions: Optional[List[Dict[str, Any]]] = None
    ) -> List[DiscussionIntelligenceItem]:
        results: List[DiscussionIntelligenceItem] = []
        msg_map: Dict[str, List[Dict[str, Any]]] = {}
        for m in (messages or []):
            did = str(m.get("discussion_id"))
            msg_map.setdefault(did, []).append(m)

        vp_map: Dict[str, List[Dict[str, Any]]] = {}
        for vp in (viewpoints or []):
            did = str(vp.get("discussion_id"))
            vp_map.setdefault(did, []).append(vp)

        for d in discussions:
            did = str(d.get("id"))
            d_msgs = msg_map.get(did, [])
            d_vps = vp_map.get(did, [])

            participants: Set[str] = set()
            author = d.get("author_id") or d.get("authorId")
            if author:
                participants.add(str(author))
            for m in d_msgs:
                m_auth = m.get("author_id") or m.get("authorId")
                if m_auth:
                    participants.add(str(m_auth))
            for vp in d_vps:
                vp_auth = vp.get("author_id")
                if vp_auth:
                    participants.add(str(vp_auth))

            pro = int(d.get("consensus_pro", 0))
            con = int(d.get("consensus_con", 0))
            total_votes = pro + con

            # Divergence computation
            if total_votes > 0:
                divergence = round(abs(pro - con) / total_votes, 2)
            else:
                divergence = 0.85 # High uncertainty if 0 votes recorded

            # Consensus status
            dtype = d.get("type", "general")
            status = d.get("status", "open")

            if status == "resolved" or (pro >= 2 and pro >= con * 2):
                consensus_status = "consensus_reached"
            elif total_votes == 0:
                consensus_status = "needs_vote"
            elif total_votes >= 2 and abs(pro - con) <= 1:
                consensus_status = "unresolved_disagreement"
            elif dtype in ("architectural_debate", "unresolved_blocker") or status in ("divergent", "fragmented"):
                consensus_status = "fragmented"
            else:
                consensus_status = "open"

            # Extract unresolved questions
            all_text = f"{d.get('title', '')} {d.get('content', '')} " + " ".join(
                str(m.get("content", "")) for m in d_msgs
            )
            questions: List[str] = []
            for sentence in re.split(r'[.!\n]+', all_text):
                trimmed = sentence.strip()
                if trimmed.endswith("?") and len(trimmed) > 10:
                    if trimmed not in questions:
                        questions.append(trimmed)

            suggested_res = d.get("resolution") or (
                f"Formulate consensus action item from discussion '{d.get('title')}'."
            )

            results.append(
                DiscussionIntelligenceItem(
                    id=did,
                    title=d.get("title", f"Discussion {did}"),
                    type=dtype,
                    status=status,
                    message_count=len(d_msgs),
                    participant_count=max(len(participants), 1),
                    viewpoint_count=len(d_vps),
                    vote_count=total_votes,
                    pro_votes=pro,
                    con_votes=con,
                    divergence_score=divergence,
                    consensus_status=consensus_status,
                    unresolved_questions=questions[:3],
                    suggested_resolution=suggested_res
                )
            )

        return results

    @classmethod
    def analyze_discussion(
        cls,
        discussion: Dict[str, Any],
        messages: Optional[List[Dict[str, Any]]] = None,
        viewpoints: Optional[List[Dict[str, Any]]] = None,
        decisions: Optional[List[Dict[str, Any]]] = None
    ) -> DiscussionIntelligenceItem:
        from backend.repository import Repository
        did = str(discussion.get("id"))
        if messages is None:
            messages = Repository.get_discussion_messages(did)
        if viewpoints is None:
            viewpoints = Repository.get_discussion_viewpoints(did)
        if decisions is None:
            decisions = Repository.get_discussion_decisions(did)
        return cls.analyze_discussions([discussion], messages=messages, viewpoints=viewpoints, decisions=decisions)[0]
