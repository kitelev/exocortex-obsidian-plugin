import type { Triple } from "@exocortex/core";
import type { GraphData, GraphNode, GraphEdge } from "@exocortex/core";

export class RDFToGraphDataConverter {
  private static readonly RDFS_LABEL = "http://www.w3.org/2000/01/rdf-schema#label";
  private static readonly RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

  public static convert(triples: Triple[]): GraphData {
    const nodeMap = new Map<string, GraphNode>();
    const edges: GraphEdge[] = [];

    for (const triple of triples) {
      const subjectStr = triple.subject.toString();
      const predicateStr = triple.predicate.toString();
      const objectStr = triple.object.toString();

      const subjectIRI = this.extractIRI(subjectStr);
      if (subjectIRI && !nodeMap.has(subjectIRI)) {
        nodeMap.set(subjectIRI, this.createNode(subjectIRI));
      }

      const objectIRI = this.extractIRI(objectStr);
      if (objectIRI && !nodeMap.has(objectIRI)) {
        nodeMap.set(objectIRI, this.createNode(objectIRI));
      }

      if (predicateStr === this.RDFS_LABEL && subjectIRI) {
        const node = nodeMap.get(subjectIRI);
        if (node) {
          const label = this.extractLiteral(objectStr);
          if (label) {
            node.label = label;
            node.title = label;
          }
        }
      }

      if (predicateStr === this.RDF_TYPE && subjectIRI) {
        const node = nodeMap.get(subjectIRI);
        if (node) {
          const typeIRI = this.extractIRI(objectStr);
          if (typeIRI) {
            node.assetClass = this.extractBasename(typeIRI);
          }
        }
      }

      if (subjectIRI && objectIRI) {
        edges.push({
          source: subjectIRI,
          target: objectIRI,
          type: "forward-link",
        });
      }
    }

    return {
      nodes: Array.from(nodeMap.values()),
      edges,
    };
  }

  private static createNode(iri: string): GraphNode {
    const basename = this.extractBasename(iri);
    return {
      path: iri,
      title: basename,
      label: basename,
      isArchived: false,
    };
  }

  private static extractIRI(str: string): string | null {
    const match = str.match(/^<(.+)>$/);
    return match ? match[1] : null;
  }

  private static extractLiteral(str: string): string | null {
    const match = str.match(/^"(.+)"(?:@\w+)?(?:\^\^<.+>)?$/);
    return match ? match[1] : null;
  }

  private static extractBasename(iri: string): string {
    const parts = iri.split(/[/#]/);
    return parts[parts.length - 1] || iri;
  }
}
