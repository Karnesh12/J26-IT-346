// Grad-CAM heatmap + rule-based text explanation.
export default function ExplanationCard({ e, inputImage }) {
  return (
    <section className="card">
      <div className="card-head">
        <h2>4 · Explanation <span className="muted">({e.method})</span></h2>
        {e.review_recommended
          ? <span className="badge warn">Human review recommended</span>
          : e.region_uncertain
            ? <span className="badge info">Sub-region uncertain</span>
            : <span className="badge ok">Confident</span>}
      </div>
      <div className="images">
        <figure>
          <img src={inputImage} alt="Model input" />
          <figcaption>Model input (224×224, grayscale)</figcaption>
        </figure>
        <figure>
          <img src={e.heatmap} alt="Grad-CAM heatmap" />
          <figcaption>Where the model looked (red = most important)</figcaption>
        </figure>
      </div>
      <p className="explanation">{e.text}</p>
    </section>
  );
}
