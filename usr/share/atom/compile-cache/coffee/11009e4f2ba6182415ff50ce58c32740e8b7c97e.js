(function() {
  var Point, SublimeSelectEditorHandler,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Point = require('atom').Point;

  module.exports = SublimeSelectEditorHandler = (function() {
    function SublimeSelectEditorHandler(editor, inputCfg) {
      this.onRangeChange = bind(this.onRangeChange, this);
      this.onBlur = bind(this.onBlur, this);
      this.onMouseEventToHijack = bind(this.onMouseEventToHijack, this);
      this.onMouseMove = bind(this.onMouseMove, this);
      this.onMouseDown = bind(this.onMouseDown, this);
      this.editor = editor;
      this.inputCfg = inputCfg;
      this._resetState();
      this._setup_vars();
    }

    SublimeSelectEditorHandler.prototype.subscribe = function() {
      this.selection_observer = this.editor.onDidChangeSelectionRange(this.onRangeChange);
      this.editorElement.addEventListener('mousedown', this.onMouseDown);
      this.editorElement.addEventListener('mousemove', this.onMouseMove);
      this.editorElement.addEventListener('mouseup', this.onMouseEventToHijack);
      this.editorElement.addEventListener('mouseleave', this.onMouseEventToHijack);
      this.editorElement.addEventListener('mouseenter', this.onMouseEventToHijack);
      this.editorElement.addEventListener('contextmenu', this.onMouseEventToHijack);
      return this.editorElement.addEventListener('blur', this.onBlur);
    };

    SublimeSelectEditorHandler.prototype.unsubscribe = function() {
      this._resetState();
      this.selection_observer.dispose();
      this.editorElement.removeEventListener('mousedown', this.onMouseDown);
      this.editorElement.removeEventListener('mousemove', this.onMouseMove);
      this.editorElement.removeEventListener('mouseup', this.onMouseEventToHijack);
      this.editorElement.removeEventListener('mouseleave', this.onMouseEventToHijack);
      this.editorElement.removeEventListener('mouseenter', this.onMouseEventToHijack);
      this.editorElement.removeEventListener('contextmenu', this.onMouseEventToHijack);
      return this.editorElement.removeEventListener('blur', this.onBlur);
    };

    SublimeSelectEditorHandler.prototype.onMouseDown = function(e) {
      if (this.mouseStartPos) {
        e.preventDefault();
        return false;
      }
      if (this._mainMouseAndKeyDown(e)) {
        this._resetState();
        this.mouseStartPos = this._screenPositionForMouseEvent(e);
        this.mouseEndPos = this.mouseStartPos;
        e.preventDefault();
        return false;
      }
    };

    SublimeSelectEditorHandler.prototype.onMouseMove = function(e) {
      if (this.mouseStartPos) {
        e.preventDefault();
        if (this._mainMouseDown(e)) {
          this.mouseEndPos = this._screenPositionForMouseEvent(e);
          if (this.mouseEndPos.isEqual(this.mouseEndPosPrev)) {
            return;
          }
          this._selectBoxAroundCursors();
          this.mouseEndPosPrev = this.mouseEndPos;
          return false;
        }
        if (e.which === 0) {
          return this._resetState();
        }
      }
    };

    SublimeSelectEditorHandler.prototype.onMouseEventToHijack = function(e) {
      if (this.mouseStartPos) {
        e.preventDefault();
        return false;
      }
    };

    SublimeSelectEditorHandler.prototype.onBlur = function(e) {
      return this._resetState();
    };

    SublimeSelectEditorHandler.prototype.onRangeChange = function(newVal) {
      if (this.mouseStartPos && !newVal.selection.isSingleScreenLine()) {
        newVal.selection.destroy();
        return this._selectBoxAroundCursors();
      }
    };

    SublimeSelectEditorHandler.prototype._resetState = function() {
      this.mouseStartPos = null;
      return this.mouseEndPos = null;
    };

    SublimeSelectEditorHandler.prototype._setup_vars = function() {
      if (this.editorElement == null) {
        this.editorElement = atom.views.getView(this.editor);
      }
      return this.editorComponent != null ? this.editorComponent : this.editorComponent = this.editorElement.component;
    };

    SublimeSelectEditorHandler.prototype._screenPositionForMouseEvent = function(e) {
      var column, defaultCharWidth, pixelPosition, row, targetLeft, targetTop;
      this._setup_vars();
      pixelPosition = this.editorComponent.pixelPositionForMouseEvent(e);
      targetTop = pixelPosition.top;
      targetLeft = pixelPosition.left;
      defaultCharWidth = this.editor.getDefaultCharWidth();
      row = Math.floor(targetTop / this.editor.getLineHeightInPixels());
      if (row > this.editor.getLastBufferRow()) {
        targetLeft = 2e308;
      }
      row = Math.min(row, this.editor.getLastBufferRow());
      row = Math.max(0, row);
      column = Math.round(targetLeft / defaultCharWidth);
      return new Point(row, column);
    };

    SublimeSelectEditorHandler.prototype._mainMouseDown = function(e) {
      return e.which === this.inputCfg.mouseNum;
    };

    SublimeSelectEditorHandler.prototype._mainMouseAndKeyDown = function(e) {
      if (this.inputCfg.selectKey) {
        return this._mainMouseDown(e) && e[this.inputCfg.selectKey];
      } else {
        return this._mainMouseDown(e);
      }
    };

    SublimeSelectEditorHandler.prototype._selectBoxAroundCursors = function() {
      var i, isReversed, range, ranges, ref, ref1, row, rowLength;
      if (this.mouseStartPos && this.mouseEndPos) {
        ranges = [];
        for (row = i = ref = this.mouseStartPos.row, ref1 = this.mouseEndPos.row; ref <= ref1 ? i <= ref1 : i >= ref1; row = ref <= ref1 ? ++i : --i) {
          if (this.mouseEndPos.column < 0) {
            this.mouseEndPos.column = 0;
          }
          rowLength = this.editor.lineTextForScreenRow(row).length;
          if (rowLength > this.mouseStartPos.column || rowLength > this.mouseEndPos.column) {
            range = [[row, this.mouseStartPos.column], [row, this.mouseEndPos.column]];
            ranges.push(range);
          }
        }
        if (ranges.length) {
          isReversed = this.mouseEndPos.column < this.mouseStartPos.column;
          return this.editor.setSelectedScreenRanges(ranges, {
            reversed: isReversed
          });
        }
      }
    };

    return SublimeSelectEditorHandler;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2xpYnJhcnkvRW1iZXIgc2F0ZWxsaXRlIHByb2plY3RzL3dyZWF0aGUvdXNyL3NoYXJlL2F0b20vcGFja2FnZXMvU3VibGltZS1TdHlsZS1Db2x1bW4tU2VsZWN0aW9uL2xpYi9lZGl0b3ItaGFuZGxlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLGlDQUFBO0lBQUE7O0VBQUMsUUFBUyxPQUFBLENBQVEsTUFBUjs7RUFFVixNQUFNLENBQUMsT0FBUCxHQUNRO0lBQ1Msb0NBQUMsTUFBRCxFQUFTLFFBQVQ7Ozs7OztNQUNYLElBQUMsQ0FBQSxNQUFELEdBQVU7TUFDVixJQUFDLENBQUEsUUFBRCxHQUFZO01BQ1osSUFBQyxDQUFBLFdBQUQsQ0FBQTtNQUNBLElBQUMsQ0FBQSxXQUFELENBQUE7SUFKVzs7eUNBTWIsU0FBQSxHQUFXLFNBQUE7TUFDVCxJQUFDLENBQUEsa0JBQUQsR0FBc0IsSUFBQyxDQUFBLE1BQU0sQ0FBQyx5QkFBUixDQUFrQyxJQUFDLENBQUEsYUFBbkM7TUFDdEIsSUFBQyxDQUFBLGFBQWEsQ0FBQyxnQkFBZixDQUFnQyxXQUFoQyxFQUErQyxJQUFDLENBQUEsV0FBaEQ7TUFDQSxJQUFDLENBQUEsYUFBYSxDQUFDLGdCQUFmLENBQWdDLFdBQWhDLEVBQStDLElBQUMsQ0FBQSxXQUFoRDtNQUNBLElBQUMsQ0FBQSxhQUFhLENBQUMsZ0JBQWYsQ0FBZ0MsU0FBaEMsRUFBK0MsSUFBQyxDQUFBLG9CQUFoRDtNQUNBLElBQUMsQ0FBQSxhQUFhLENBQUMsZ0JBQWYsQ0FBZ0MsWUFBaEMsRUFBK0MsSUFBQyxDQUFBLG9CQUFoRDtNQUNBLElBQUMsQ0FBQSxhQUFhLENBQUMsZ0JBQWYsQ0FBZ0MsWUFBaEMsRUFBK0MsSUFBQyxDQUFBLG9CQUFoRDtNQUNBLElBQUMsQ0FBQSxhQUFhLENBQUMsZ0JBQWYsQ0FBZ0MsYUFBaEMsRUFBK0MsSUFBQyxDQUFBLG9C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QUF1QixDQUFFLENBQUEsSUFBQyxDQUFBLFFBQVEsQ0FBQyxTQUFWLEVBRDNCO09BQUEsTUFBQTtlQUdFLElBQUMsQ0FBQSxjQUFELENBQWdCLENBQWhCLEVBSEY7O0lBRG9COzt5Q0FPdEIsdUJBQUEsR0FBeUIsU0FBQTtBQUN2QixVQUFBO01BQUEsSUFBRyxJQUFDLENBQUEsYUFBRCxJQUFtQixJQUFDLENBQUEsV0FBdkI7UUFDRSxNQUFBLEdBQVM7QUFFVCxhQUFXLHVJQUFYO1VBQ0UsSUFBMkIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxNQUFiLEdBQXNCLENBQWpEO1lBQUEsSUFBQyxDQUFBLFdBQVcsQ0FBQyxNQUFiLEdBQXNCLEVBQXRCOztVQUNBLFNBQUEsR0FBWSxJQUFDLENBQUEsTUFBTSxDQUFDLG9CQUFSLENBQTZCLEdBQTdCLENBQWlDLENBQUM7VUFDOUMsSUFBRyxTQUFBLEdBQVksSUFBQyxDQUFBLGFBQWEsQ0FBQyxNQUEzQixJQUFxQyxTQUFBLEdBQVksSUFBQyxDQUFBLFdBQVcsQ0FBQyxNQUFqRTtZQUNFLEtBQUEsR0FBUSxDQUFDLENBQUMsR0FBRCxFQUFNLElBQUMsQ0FBQSxhQUFhLENBQUMsTUFBckIsQ0FBRCxFQUErQixDQUFDLEdBQUQsRUFBTSxJQUFDLENBQUEsV0FBVyxDQUFDLE1BQW5CLENBQS9CO1lBQ1IsTUFBTSxDQUFDLElBQVAsQ0FBWSxLQUFaLEVBRkY7O0FBSEY7UUFPQSxJQUFHLE1BQU0sQ0FBQyxNQUFWO1VBQ0UsVUFBQSxHQUFhLElBQUMsQ0FBQSxXQUFXLENBQUMsTUFBYixHQUFzQixJQUFDLENBQUEsYUFBYSxDQUFDO2lCQUNsRCxJQUFDLENBQUEsTUFBTSxDQUFDLHVCQUFSLENBQWdDLE1BQWhDLEVBQXdDO1lBQUMsUUFBQSxFQUFVLFVBQVg7V0FBeEMsRUFGRjtTQVZGOztJQUR1Qjs7Ozs7QUE5RzdCIiwic291cmNlc0NvbnRlbnQiOlsie1BvaW50fSA9IHJlcXVpcmUgJ2F0b20nXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgY2xhc3MgU3VibGltZVNlbGVjdEVkaXRvckhhbmRsZXJcbiAgICBjb25zdHJ1Y3RvcjogKGVkaXRvciwgaW5wdXRDZmcpIC0+XG4gICAgICBAZWRpdG9yID0gZWRpdG9yXG4gICAgICBAaW5wdXRDZmcgPSBpbnB1dENmZ1xuICAgICAgQF9yZXNldFN0YXRlKClcbiAgICAgIEBfc2V0dXBfdmFycygpXG5cbiAgICBzdWJzY3JpYmU6IC0+XG4gICAgICBAc2VsZWN0aW9uX29ic2VydmVyID0gQGVkaXRvci5vbkRpZENoYW5nZVNlbGVjdGlvblJhbmdlIEBvblJhbmdlQ2hhbmdlXG4gICAgICBAZWRpdG9yRWxlbWVudC5hZGRFdmVudExpc3RlbmVyICdtb3VzZWRvd24nLCAgIEBvbk1vdXNlRG93blxuICAgICAgQGVkaXRvckVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2Vtb3ZlJywgICBAb25Nb3VzZU1vdmVcbiAgICAgIEBlZGl0b3JFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNldXAnLCAgICAgQG9uTW91c2VFdmVudFRvSGlqYWNrXG4gICAgICBAZWRpdG9yRWxlbWVudC5hZGRFdmVudExpc3RlbmVyICdtb3VzZWxlYXZlJywgIEBvbk1vdXNlRXZlbnRUb0hpamFja1xuICAgICAgQGVkaXRvckVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2VlbnRlcicsICBAb25Nb3VzZUV2ZW50VG9IaWphY2tcbiAgICAgIEBlZGl0b3JFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIgJ2NvbnRleHRtZW51JywgQG9uTW91c2VFdmVudFRvSGlqYWNrXG4gICAgICBAZWRpdG9yRWxlbWVudC5hZGRFdmVudExpc3RlbmVyICdibHVyJywgICAgICAgIEBvbkJsdXJcblxuICAgIHVuc3Vic2NyaWJlOiAtPlxuICAgICAgQF9yZXNldFN0YXRlKClcbiAgICAgIEBzZWxlY3Rpb25fb2JzZXJ2ZXIuZGlzcG9zZSgpXG4gICAgICBAZWRpdG9yRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyICdtb3VzZWRvd24nLCAgIEBvbk1vdXNlRG93blxuICAgICAgQGVkaXRvckVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciAnbW91c2Vtb3ZlJywgICBAb25Nb3VzZU1vdmVcbiAgICAgIEBlZGl0b3JFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ21vdXNldXAnLCAgICAgQG9uTW91c2VFdmVudFRvSGlqYWNrXG4gICAgICBAZWRpdG9yRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyICdtb3VzZWxlYXZlJywgIEBvbk1vdXNlRXZlbnRUb0hpamFja1xuICAgICAgQGVkaXRvckVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciAnbW91c2VlbnRlcicsICBAb25Nb3VzZUV2ZW50VG9IaWphY2tcbiAgICAgIEBlZGl0b3JFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2NvbnRleHRtZW51JywgQG9uTW91c2VFdmVudFRvSGlqYWNrXG4gICAgICBAZWRpdG9yRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyICdibHVyJywgICAgICAgIEBvbkJsdXJcblxuICAgICMgLS0tLS0tLVxuICAgICMgRXZlbnQgSGFuZGxlcnNcbiAgICAjIC0tLS0tLS1cblxuICAgIG9uTW91c2VEb3duOiAoZSkgPT5cbiAgICAgIGlmIEBtb3VzZVN0YXJ0UG9zXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgICAgaWYgQF9tYWluTW91c2VBbmRLZXlEb3duKGUpXG4gICAgICAgIEBfcmVzZXRTdGF0ZSgpXG4gICAgICAgIEBtb3VzZVN0YXJ0UG9zID0gQF9zY3JlZW5Qb3NpdGlvbkZvck1vdXNlRXZlbnQoZSlcbiAgICAgICAgQG1vdXNlRW5kUG9zICAgPSBAbW91c2VTdGFydFBvc1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICBvbk1vdXNlTW92ZTogKGUpID0+XG4gICAgICBpZiBAbW91c2VTdGFydFBvc1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgaWYgQF9tYWluTW91c2VEb3duKGUpXG4gICAgICAgICAgQG1vdXNlRW5kUG9zID0gQF9zY3JlZW5Qb3NpdGlvbkZvck1vdXNlRXZlbnQoZSlcbiAgICAgICAgICByZXR1cm4gaWYgQG1vdXNlRW5kUG9zLmlzRXF1YWwgQG1vdXNlRW5kUG9zUHJldlxuICAgICAgICAgIEBfc2VsZWN0Qm94QXJvdW5kQ3Vyc29ycygpXG4gICAgICAgICAgQG1vdXNlRW5kUG9zUHJldiA9IEBtb3VzZUVuZFBvc1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICBpZiBlLndoaWNoID09IDBcbiAgICAgICAgICBAX3Jlc2V0U3RhdGUoKVxuXG4gICAgIyBIaWphY2sgYWxsIHRoZSBtb3VzZSBldmVudHMgd2hpbGUgc2VsZWN0aW5nXG4gICAgb25Nb3VzZUV2ZW50VG9IaWphY2s6IChlKSA9PlxuICAgICAgaWYgQG1vdXNlU3RhcnRQb3NcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgb25CbHVyOiAoZSkgPT5cbiAgICAgIEBfcmVzZXRTdGF0ZSgpXG5cbiAgICBvblJhbmdlQ2hhbmdlOiAobmV3VmFsKSA9PlxuICAgICAgaWYgQG1vdXNlU3RhcnRQb3MgYW5kICFuZXdWYWwuc2VsZWN0aW9uLmlzU2luZ2xlU2NyZWVuTGluZSgpXG4gICAgICAgIG5ld1ZhbC5zZWxlY3Rpb24uZGVzdHJveSgpXG4gICAgICAgIEBfc2VsZWN0Qm94QXJvdW5kQ3Vyc29ycygpXG5cbiAgICAjIC0tLS0tLS1cbiAgICAjIE1ldGhvZHNcbiAgICAjIC0tLS0tLS1cblxuICAgIF9yZXNldFN0YXRlOiAtPlxuICAgICAgQG1vdXNlU3RhcnRQb3MgPSBudWxsXG4gICAgICBAbW91c2VFbmRQb3MgICA9IG51bGxcblxuICAgIF9zZXR1cF92YXJzOiAtPlxuICAgICAgQGVkaXRvckVsZW1lbnQgPz0gYXRvbS52aWV3cy5nZXRWaWV3IEBlZGl0b3JcbiAgICAgIEBlZGl0b3JDb21wb25lbnQgPz0gQGVkaXRvckVsZW1lbnQuY29tcG9uZW50XG5cbiAgICAjIEkgaGFkIHRvIGNyZWF0ZSBteSBvd24gdmVyc2lvbiBvZiBAZWRpdG9yQ29tcG9uZW50LnNjcmVlblBvc2l0aW9uRnJvbU1vdXNlRXZlbnRcbiAgICBfc2NyZWVuUG9zaXRpb25Gb3JNb3VzZUV2ZW50OiAoZSkgLT5cbiAgICAgIEBfc2V0dXBfdmFycygpXG4gICAgICBwaXhlbFBvc2l0aW9uICAgID0gQGVkaXRvckNvbXBvbmVudC5waXhlbFBvc2l0aW9uRm9yTW91c2VFdmVudChlKVxuICAgICAgdGFyZ2V0VG9wICAgICAgICA9IHBpeGVsUG9zaXRpb24udG9wXG4gICAgICB0YXJnZXRMZWZ0ICAgICAgID0gcGl4ZWxQb3NpdGlvbi5sZWZ0XG4gICAgICBkZWZhdWx0Q2hhcldpZHRoID0gQGVkaXRvci5nZXREZWZhdWx0Q2hhcldpZHRoKClcbiAgICAgIHJvdyAgICAgICAgICAgICAgPSBNYXRoLmZsb29yKHRhcmdldFRvcCAvIEBlZGl0b3IuZ2V0TGluZUhlaWdodEluUGl4ZWxzKCkpXG4gICAgICB0YXJnZXRMZWZ0ICAgICAgID0gSW5maW5pdHkgaWYgcm93ID4gQGVkaXRvci5nZXRMYXN0QnVmZmVyUm93KClcbiAgICAgIHJvdyAgICAgICAgICAgICAgPSBNYXRoLm1pbihyb3csIEBlZGl0b3IuZ2V0TGFzdEJ1ZmZlclJvdygpKVxuICAgICAgcm93ICAgICAgICAgICAgICA9IE1hdGgubWF4KDAsIHJvdylcbiAgICAgIGNvbHVtbiAgICAgICAgICAgPSBNYXRoLnJvdW5kICh0YXJnZXRMZWZ0KSAvIGRlZmF1bHRDaGFyV2lkdGhcbiAgICAgIG5ldyBQb2ludChyb3csIGNvbHVtbilcblxuICAgICMgbWV0aG9kcyBmb3IgY2hlY2tpbmcgbW91c2Uva2V5IHN0YXRlIGFnYWluc3QgY29uZmlnXG4gICAgX21haW5Nb3VzZURvd246IChlKSAtPlxuICAgICAgZS53aGljaCBpcyBAaW5wdXRDZmcubW91c2VOdW1cblxuICAgIF9tYWluTW91c2VBbmRLZXlEb3duOiAoZSkgLT5cbiAgICAgIGlmIEBpbnB1dENmZy5zZWxlY3RLZXlcbiAgICAgICAgQF9tYWluTW91c2VEb3duKGUpIGFuZCBlW0BpbnB1dENmZy5zZWxlY3RLZXldXG4gICAgICBlbHNlXG4gICAgICAgIEBfbWFpbk1vdXNlRG93bihlKVxuXG4gICAgIyBEbyB0aGUgYWN0dWFsIHNlbGVjdGluZ1xuICAgIF9zZWxlY3RCb3hBcm91bmRDdXJzb3JzOiAtPlxuICAgICAgaWYgQG1vdXNlU3RhcnRQb3MgYW5kIEBtb3VzZUVuZFBvc1xuICAgICAgICByYW5nZXMgPSBbXVxuXG4gICAgICAgIGZvciByb3cgaW4gW0Btb3VzZVN0YXJ0UG9zLnJvdy4uQG1vdXNlRW5kUG9zLnJvd11cbiAgICAgICAgICBAbW91c2VFbmRQb3MuY29sdW1uID0gMCBpZiBAbW91c2VFbmRQb3MuY29sdW1uIDwgMFxuICAgICAgICAgIHJvd0xlbmd0aCA9IEBlZGl0b3IubGluZVRleHRGb3JTY3JlZW5Sb3cocm93KS5sZW5ndGhcbiAgICAgICAgICBpZiByb3dMZW5ndGggPiBAbW91c2VTdGFydFBvcy5jb2x1bW4gb3Igcm93TGVuZ3RoID4gQG1vdXNlRW5kUG9zLmNvbHVtblxuICAgICAgICAgICAgcmFuZ2UgPSBbW3JvdywgQG1vdXNlU3RhcnRQb3MuY29sdW1uXSwgW3JvdywgQG1vdXNlRW5kUG9zLmNvbHVtbl1dXG4gICAgICAgICAgICByYW5nZXMucHVzaCByYW5nZVxuXG4gICAgICAgIGlmIHJhbmdlcy5sZW5ndGhcbiAgICAgICAgICBpc1JldmVyc2VkID0gQG1vdXNlRW5kUG9zLmNvbHVtbiA8IEBtb3VzZVN0YXJ0UG9zLmNvbHVtblxuICAgICAgICAgIEBlZGl0b3Iuc2V0U2VsZWN0ZWRTY3JlZW5SYW5nZXMgcmFuZ2VzLCB7cmV2ZXJzZWQ6IGlzUmV2ZXJzZWR9XG4iXX0=
