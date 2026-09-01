export default function PlanningLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        .input-card {
          padding: 22px 24px;
          border-radius: 18px;
          box-shadow: 0 8px 28px rgba(15, 23, 42, .045);
        }

        .section-title {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 20px;
        }

        .section-title h2 {
          margin: 0;
          font-size: 18px;
          letter-spacing: -.01em;
        }

        .section-title p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 12px;
        }

        .planning-form-grid {
          display: grid;
          grid-template-columns: 1.15fr 1.15fr 1fr .8fr;
          gap: 12px;
        }

        .planning-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-width: 0;
        }

        .planning-field > span {
          color: #475569;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .045em;
          text-transform: uppercase;
        }

        .planning-field select {
          width: 100%;
          min-width: 0;
          height: 44px;
          appearance: none;
          -webkit-appearance: none;
          border: 1px solid #d8e0eb;
          border-radius: 11px;
          padding: 0 38px 0 13px;
          color: #172033;
          background-color: #fff;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364758b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 13px center;
          font-size: 13px;
          font-weight: 600;
          outline: none;
          cursor: pointer;
          transition: border-color .15s ease, box-shadow .15s ease, background-color .15s ease;
        }

        .planning-field select:hover {
          border-color: #b8c5d8;
          background-color: #fbfdff;
        }

        .planning-field select:focus {
          border-color: #4f7ff0;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, .10);
        }

        .planning-field select:disabled {
          opacity: .65;
          cursor: not-allowed;
          background-color: #f8fafc;
        }

        .planning-options {
          display: flex;
          gap: 9px;
          margin: 14px 0 17px;
        }

        .option-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 38px;
          padding: 0 12px;
          border: 1px solid #dce3ed;
          border-radius: 10px;
          background: #f8fafc;
          color: #334155;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all .15s ease;
        }

        .option-pill:hover {
          border-color: #b8c5d8;
          background: #fff;
        }

        .option-pill input {
          width: 16px;
          height: 16px;
          margin: 0;
          accent-color: #2563eb;
        }

        .add-session-btn {
          min-height: 42px;
          padding: 0 17px;
          border: 0;
          border-radius: 11px;
          background: #2563eb;
          color: #fff;
          font-size: 13px;
          font-weight: 800;
          box-shadow: 0 5px 13px rgba(37, 99, 235, .20);
          cursor: pointer;
          transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
        }

        .add-session-btn:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 7px 16px rgba(37, 99, 235, .24);
        }

        .add-session-btn:disabled {
          opacity: .55;
          cursor: not-allowed;
          box-shadow: none;
        }

        @media (max-width: 1000px) {
          .planning-form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 600px) {
          .input-card { padding: 18px; }
          .section-title { flex-direction: column; gap: 10px; }
          .planning-form-grid { grid-template-columns: 1fr; }
          .planning-options { flex-wrap: wrap; }
        }
      `}</style>
      {children}
    </>
  );
}
