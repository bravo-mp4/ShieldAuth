const endpoints = [
  {
    method: "GET",
    path: "/api/v1/users",
    desc: "List users",
  },
  {
    method: "POST",
    path: "/api/v1/users",
    desc: "Create user (username, hwid, expires_at?)",
  },
  {
    method: "POST",
    path: "/api/v1/check-hwid",
    desc: "Validate a HWID",
  },
  {
    method: "DELETE",
    path: "/api/v1/users/:id",
    desc: "Delete user",
  },
] as const;

export default function Docs() {
  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <div className="pageTitle">API Documentation</div>
          <div className="pageSub">Your backend endpoints at a glance</div>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="cardTitle">Base URL</div>
          <div className="codePill">/api/v1</div>
          <div className="muted" style={{ marginTop: 10 }}>
            Development proxy: <span className="codeInline">/api</span> →{" "}
            <span className="codeInline">localhost:3000</span>
          </div>
        </div>
        <div className="card">
          <div className="cardTitle">Important Notes</div>
          <div className="muted">
            HWIDs are hashed server-side. Store and compare the hash — never the
            raw HWID.
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="cardTitle">Endpoints</div>
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Method</th>
                <th>Path</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((e) => (
                <tr key={`${e.method}:${e.path}`}>
                  <td className="mono green">{e.method}</td>
                  <td className="mono">{e.path}</td>
                  <td className="muted">{e.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="cardTitle">Example: Create User</div>
        <pre className="codeBlock">
          {`POST /api/v1/users
{
  "username": "alice",
  "hwid": "HWID-STRING",
  "expires_at": "2026-12-31T23:59:59Z"
}`}
        </pre>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="cardTitle">Example: Check HWID</div>
        <pre className="codeBlock">
          {`POST /api/v1/check-hwid
{
  "hwid": "HWID-STRING"
}`}
        </pre>
      </div>
    </div>
  );
}
