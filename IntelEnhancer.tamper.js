// ==UserScript==
// @name       Intel Enhancer
// @namespace  http://github.com/DeviateFish/
// @version    0.9
// @description  Draws upon http://www.elliottsprehn.com/preso/fluentconf/#/ for inspiration.  Expects intel map (and by proxy, google's closure library) to be present
// @match      http://www.ingress.com/intel*
// @match      https://www.ingress.com/intel*
// @copyright  2013+, Daniel Benton
// ==/UserScript==
(function (window) {

  var async = function (f) {
    var end = Date.now() + 16;
    while (goog.isFunction(f) && Date.now() < end) {
      f = f();
    }
    if (goog.isFunction(f)) {
      var next = async.bind(null, f);
      setTimeout(next, 0);
    }
  };

  var aForEach = function (a, f, end) {
    var i = 0;
    async(function next() {
      if (i >= a.length) return end;
      f(a[i++]);
      return next;
    });
  };

  nemesis.dashboard.render.ShapeRender.prototype.drawSingle = function (a) {
    shouldShow(this.getPoints(a)) && (this.show(a), this.entities_[a.guid] = a, dm.deleteEntityFromCache(a.guid))
  };

  nemesis.dashboard.DataManager.prototype.getAllEntitiesToRender = function () {
    var entities = this.guidsToDraw_,
      a = [];
    this.guidsToDraw_ = [];
    goog.array.removeDuplicates(entities);
    goog.array.forEach(entities, function (c) {
      if (this.isEntityInViewport(c) && !(c in this.artifactPortalsByGuid_) && (c = this.gameEntityCache_.getEntity(c))) {
        a.push(c);
      }
    }, this);
    return a;
  };

  var pr = nemesis.dashboard.render.PortalRender.getInstance(),
    er = nemesis.dashboard.render.EdgeRender.getInstance(),
    rr = nemesis.dashboard.render.RegionRender.getInstance(),
    ar = nemesis.dashboard.render.ArtifactPortalRender.getInstance(),
    dm = nemesis.dashboard.DataManager.getInstance(),
    shouldShow = nemesis.dashboard.render.ShapeRender.shouldShowEntityWithPoints_;
  var renderers = {}, empty = {};
  renderers[nemesis.dashboard.data.GameEntity.Type.PORTAL] = function (portal) {
    nemesis.dashboard.render.PortalRender.shouldShowPortal(portal) && pr.showPortal(portal);
  };
  renderers[nemesis.dashboard.data.GameEntity.Type.EDGE] = function (edge) {
    er.drawSingle(edge);
  };
  renderers[nemesis.dashboard.data.GameEntity.Type.REGION] = function (region) {
    rr.drawSingle(region);
  };

  nemesis.dashboard.render.drawGameEntities__ = nemesis.dashboard.render.drawGameEntities;
  nemesis.dashboard.render.drawGameEntities = function () {
    goog.global.clearTimeout(nemesis.dashboard.render.drawGameEntitiesTimeout_);
    nemesis.dashboard.render.drawGameEntitiesTimeout_ = null;
    var entities = dm.getAllEntitiesToRender();
    aForEach(entities,
      function (a) {
        renderers.hasOwnProperty(a.entityType) && renderers[a.entityType](a);
      }, function () {
        nemesis.dashboard.render.maybeHighlightPortal_();
        ar.draw(dm.getArtifactPortals());
        pr.draw(empty);
        er.draw(empty);
        rr.draw(empty);
      });
  };

}(window.unsafeWindow || window));
