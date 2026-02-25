import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { DndProvider, useDndContext } from "./DndContext";

function DndConsumer() {
  const { isDragging, dragType, dragId, overTargetId, setDragState, resetDrag } = useDndContext();
  return (
    <div>
      <span data-testid="isDragging">{String(isDragging)}</span>
      <span data-testid="dragType">{String(dragType)}</span>
      <span data-testid="dragId">{String(dragId)}</span>
      <span data-testid="overTargetId">{String(overTargetId)}</span>
      <button
        data-testid="setDragState"
        onClick={() => setDragState({ isDragging: true, dragType: "workspace", dragId: "ws-1" })}
      />
      <button
        data-testid="setOverTarget"
        onClick={() => setDragState({ overTargetId: "folder-2" })}
      />
      <button data-testid="resetDrag" onClick={resetDrag} />
    </div>
  );
}

describe("DndContext", () => {
  describe("when rendered", () => {
    it("then provides initial drag state to children", () => {
      render(
        <DndProvider>
          <DndConsumer />
        </DndProvider>,
      );

      expect(screen.getByTestId("isDragging")).toHaveTextContent("false");
      expect(screen.getByTestId("dragType")).toHaveTextContent("null");
      expect(screen.getByTestId("dragId")).toHaveTextContent("null");
      expect(screen.getByTestId("overTargetId")).toHaveTextContent("null");
    });
  });

  describe("when setDragState is called with partial state", () => {
    it("then merges the new state with existing state", () => {
      render(
        <DndProvider>
          <DndConsumer />
        </DndProvider>,
      );

      act(() => {
        screen.getByTestId("setDragState").click();
      });

      expect(screen.getByTestId("isDragging")).toHaveTextContent("true");
      expect(screen.getByTestId("dragType")).toHaveTextContent("workspace");
      expect(screen.getByTestId("dragId")).toHaveTextContent("ws-1");
      // overTargetId was not set, should remain null
      expect(screen.getByTestId("overTargetId")).toHaveTextContent("null");

      // Now partially update just overTargetId
      act(() => {
        screen.getByTestId("setOverTarget").click();
      });

      // Previous state should be preserved
      expect(screen.getByTestId("isDragging")).toHaveTextContent("true");
      expect(screen.getByTestId("dragId")).toHaveTextContent("ws-1");
      expect(screen.getByTestId("overTargetId")).toHaveTextContent("folder-2");
    });
  });

  describe("when resetDrag is called", () => {
    it("then returns to initial state", () => {
      render(
        <DndProvider>
          <DndConsumer />
        </DndProvider>,
      );

      // Set some state
      act(() => {
        screen.getByTestId("setDragState").click();
      });
      expect(screen.getByTestId("isDragging")).toHaveTextContent("true");

      // Reset
      act(() => {
        screen.getByTestId("resetDrag").click();
      });

      expect(screen.getByTestId("isDragging")).toHaveTextContent("false");
      expect(screen.getByTestId("dragType")).toHaveTextContent("null");
      expect(screen.getByTestId("dragId")).toHaveTextContent("null");
      expect(screen.getByTestId("overTargetId")).toHaveTextContent("null");
    });
  });
});
