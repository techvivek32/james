import { useEffect, useState } from "react";
import { UserProfile } from "../../types";

export function TeamPage(props: {
  teamMembers: UserProfile[];
  onTeamMembersChange: (members: UserProfile[]) => void;
}) {
  const [selectedId, setSelectedId] = useState(
    props.teamMembers[0]?.id ?? ""
  );
  const [profiles, setProfiles] = useState<UserProfile[]>(props.teamMembers);
  const [search, setSearch] = useState("");

  const filteredProfiles = profiles.filter((member) => {
    const term = search.toLowerCase().trim();
    if (!term) {
      return true;
    }
    const name = member.name.toLowerCase();
    const territory = (member.territory ?? "").toLowerCase();
    const role = member.role.toLowerCase();
    return (
      name.includes(term) ||
      territory.includes(term) ||
      role.includes(term)
    );
  });

  const selected =
    profiles.find((m) => m.id === selectedId) ?? filteredProfiles[0] ?? null;

  useEffect(() => {
    setProfiles(props.teamMembers);
    if (!props.teamMembers.find((m) => m.id === selectedId)) {
      setSelectedId(props.teamMembers[0]?.id ?? "");
    }
  }, [props.teamMembers, selectedId]);

  function updateProfile(updated: UserProfile) {
    const nextProfiles = profiles.map((m) =>
      m.id === updated.id ? updated : m
    );
    setProfiles(nextProfiles);
    props.onTeamMembersChange(nextProfiles);
  }

  return (
    <div className="admin-user-management">
      <div className="panel panel-left">
        <div className="panel-header">
          <div className="panel-header-row">
            <span>Team</span>
            <div className="panel-header-actions">
              <input
                className="field-input"
                placeholder="Search team members"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="panel-body list">
          {filteredProfiles.map((member) => {
            const isActive = member.id === selectedId;
            return (
              <button
                key={member.id}
                className={isActive ? "list-item active" : "list-item"}
                onClick={() => setSelectedId(member.id)}
              >
                <div className="list-item-title">{member.name}</div>
                <div className="list-item-subtitle">
                  {member.role.toUpperCase()} • {member.territory}
                </div>
              </button>
            );
          })}
          {filteredProfiles.length === 0 && (
            <div className="panel-empty">No team members match your search.</div>
          )}
        </div>
      </div>
      <div className="panel panel-right">
        {selected ? (
          <div className="panel-scroll">
            <div className="panel-header">Rep Profile</div>
            <div className="form-grid">
              <label className="field">
                <span className="field-label">Strengths / Superpowers</span>
                <textarea
                  className="field-input"
                  rows={3}
                  value={selected.strengths}
                  onChange={(e) =>
                    updateProfile({
                      ...selected,
                      strengths: e.target.value
                    })
                  }
                />
              </label>
              <label className="field">
                <span className="field-label">Weaknesses / Insecurities</span>
                <textarea
                  className="field-input"
                  rows={3}
                  value={selected.weaknesses}
                  onChange={(e) =>
                    updateProfile({
                      ...selected,
                      weaknesses: e.target.value
                    })
                  }
                />
              </label>
              <label className="field">
                <span className="field-label">Web Page Mission Title</span>
                <input
                  className="field-input"
                  value={selected.missionTitle ?? ""}
                  onChange={(e) =>
                    updateProfile({
                      ...selected,
                      missionTitle: e.target.value
                    })
                  }
                />
              </label>
              <label className="field">
                <span className="field-label">Web Page Mission Body</span>
                <textarea
                  className="field-input"
                  rows={3}
                  value={selected.missionBody ?? ""}
                  onChange={(e) =>
                    updateProfile({
                      ...selected,
                      missionBody: e.target.value
                    })
                  }
                />
              </label>
              <label className="field">
                <span className="field-label">Web Page Mission CTA</span>
                <input
                  className="field-input"
                  value={selected.missionCtaLabel ?? ""}
                  onChange={(e) =>
                    updateProfile({
                      ...selected,
                      missionCtaLabel: e.target.value
                    })
                  }
                />
              </label>
              <label className="field">
                <span className="field-label">Web Page Mission Image URL</span>
                <input
                  className="field-input"
                  value={selected.missionImageUrl ?? ""}
                  onChange={(e) =>
                    updateProfile({
                      ...selected,
                      missionImageUrl: e.target.value
                    })
                  }
                />
              </label>
              <label className="field">
                <span className="field-label">Web Page Mission Title</span>
                <input
                  className="field-input"
                  value={selected.missionTitle ?? ""}
                  onChange={(e) =>
                    updateProfile({
                      ...selected,
                      missionTitle: e.target.value
                    })
                  }
                />
              </label>
              <label className="field">
                <span className="field-label">Web Page Mission Body</span>
                <textarea
                  className="field-input"
                  rows={3}
                  value={selected.missionBody ?? ""}
                  onChange={(e) =>
                    updateProfile({
                      ...selected,
                      missionBody: e.target.value
                    })
                  }
                />
              </label>
              <label className="field">
                <span className="field-label">Web Page Mission CTA</span>
                <input
                  className="field-input"
                  value={selected.missionCtaLabel ?? ""}
                  onChange={(e) =>
                    updateProfile({
                      ...selected,
                      missionCtaLabel: e.target.value
                    })
                  }
                />
              </label>
              <label className="field">
                <span className="field-label">Web Page Mission Image URL</span>
                <input
                  className="field-input"
                  value={selected.missionImageUrl ?? ""}
                  onChange={(e) =>
                    updateProfile({
                      ...selected,
                      missionImageUrl: e.target.value
                    })
                  }
                />
              </label>
              <label className="field">
                <span className="field-label">Why You Need Us Title</span>
                <input
                  className="field-input"
                  value={selected.whyUsTitle ?? ""}
                  onChange={(e) =>
                    updateProfile({
                      ...selected,
                      whyUsTitle: e.target.value
                    })
                  }
                />
              </label>
              <label className="field">
                <span className="field-label">Why You Need Us Body</span>
                <textarea
                  className="field-input"
                  rows={3}
                  value={selected.whyUsBody ?? ""}
                  onChange={(e) =>
                    updateProfile({
                      ...selected,
                      whyUsBody: e.target.value
                    })
                  }
                />
              </label>
              <label className="field">
                <span className="field-label">Expert Roofers Title</span>
                <input
                  className="field-input"
                  value={selected.expertRoofersTitle ?? ""}
                  onChange={(e) =>
                    updateProfile({
                      ...selected,
                      expertRoofersTitle: e.target.value
                    })
                  }
                />
              </label>
              <label className="field">
                <span className="field-label">Expert Roofers Body</span>
                <textarea
                  className="field-input"
                  rows={3}
                  value={selected.expertRoofersBody ?? ""}
                  onChange={(e) =>
                    updateProfile({
                      ...selected,
                      expertRoofersBody: e.target.value
                    })
                  }
                />
              </label>
            </div>
            <div className="panel-section">
              <div className="panel-section-title">Approvals</div>
              <div className="list">
                <div className="list-item">
                  <div className="list-item-title">
                    Marketing Materials Approval
                  </div>
                  <div className="list-item-subtitle">
                    Approve or reject rep-submitted assets.
                  </div>
                  <div className="list-item-actions">
                    <button className="btn-secondary">Approve</button>
                    <button className="btn-ghost">Reject</button>
                  </div>
                </div>
                <div className="list-item">
                  <div className="list-item-title">Rep Web Page Approval</div>
                  <div className="list-item-subtitle">
                    Review copy, links, and compliance items.
                  </div>
                  <div className="list-item-actions">
                    <button className="btn-secondary">Approve</button>
                    <button className="btn-ghost">Request Changes</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="panel-empty">Select a team member.</div>
        )}
      </div>
    </div>
  );
}
