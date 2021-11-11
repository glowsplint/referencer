import { render } from "@testing-library/react";

const isBeingRendered = ({
  testId,
  component,
}: {
  testId: string;
  component: React.ReactElement;
}) => {
  it("is being rendered", () => {
    const { getByTestId } = render(component);
    expect(getByTestId(testId)).toBeInTheDocument();
  });
};

export { isBeingRendered };
