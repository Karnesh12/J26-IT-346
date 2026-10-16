type StepIndicatorProps = { currentStep: 1 | 2 };

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps = ["Password", "Verification"];
  return (
    <ol className="mx-auto flex w-[290px] items-start" aria-label="Sign-in progress">
      {steps.map((step, index) => {
        const number = (index + 1) as 1 | 2;
        const active = currentStep === number;
        const complete = currentStep > number;
        return (
          <li className="relative flex flex-1 flex-col items-center" key={step} aria-current={active ? "step" : undefined}>
            {index === 0 && <span className={`absolute left-1/2 top-[17px] h-px w-full ${currentStep === 2 ? "bg-teal-500" : "bg-[#DDE4EC]"}`} />}
            <span className={`relative z-10 grid h-[36px] w-[36px] place-items-center rounded-full text-sm font-semibold ${
              active || complete ? "bg-teal-500 text-white" : "border border-[#DCE3EB] bg-[#F2F4F7] text-[#8793A3]"
            }`}>{number}</span>
            <span className={`mt-2 text-xs ${active ? "font-semibold text-navy-900" : "text-[#8793A3]"}`}>{step}</span>
          </li>
        );
      })}
    </ol>
  );
}
