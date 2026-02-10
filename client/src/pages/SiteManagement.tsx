/**
 * Site Management Page
 * CRUD operations for sites under /settings/sites
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Plus, Edit2, Trash2, MapPin, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { SiteCreationModal } from "@/components/SiteCreationModal";

export default function SiteManagement() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState<number | null>(null);

  const { data: sitesData, isLoading, refetch } = trpc.sites.list.useQuery();

  const handleSiteCreated = () => {
    refetch();
    setShowModal(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Authentification requise</CardTitle>
            <CardDescription>Veuillez vous connecter pour accéder aux sites</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/login")} className="w-full">Se connecter</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-slate-900">Gestion des Sites</h1>
            <Button onClick={() => setShowModal(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau site
            </Button>
          </div>
          <p className="text-slate-600">Gérez tous les sites de votre organisation</p>
        </div>

        {/* LOADING STATE */}
        {isLoading && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
              <span className="text-slate-600">Chargement des sites...</span>
            </CardContent>
          </Card>
        )}

        {/* EMPTY STATE */}
        {!isLoading && (!sitesData || sitesData.length === 0) && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MapPin className="h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun site créé</h3>
              <p className="text-slate-600 text-center mb-6 max-w-sm">
                Commencez par créer votre premier site pour pouvoir créer des audits.
              </p>
              <Button onClick={() => setShowModal(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Créer le premier site
              </Button>
            </CardContent>
          </Card>
        )}

        {/* SITES LIST */}
        {!isLoading && sitesData && sitesData.length > 0 && (
          <div className="grid gap-4">
            {sitesData.map((site: any) => (
              <Card key={site.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-slate-900">{site.name}</h3>
                        {site.isMainSite && (
                          <Badge variant="secondary">Site principal</Badge>
                        )}
                      </div>

                      <div className="space-y-2 text-sm text-slate-600">
                        {site.addressLine1 && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div>
                              <div>{site.addressLine1}</div>
                              {site.addressLine2 && <div>{site.addressLine2}</div>}
                              {site.city && (
                                <div>
                                  {site.city}
                                  {site.postalCode && ` ${site.postalCode}`}
                                  {site.state && `, ${site.state}`}
                                </div>
                              )}
                              {site.country && <div>{site.country}</div>}
                            </div>
                          </div>
                        )}

                        {site.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 flex-shrink-0" />
                            <a href={`mailto:${site.email}`} className="text-blue-600 hover:underline">
                              {site.email}
                            </a>
                          </div>
                        )}

                        {site.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 flex-shrink-0" />
                            <a href={`tel:${site.phone}`} className="text-blue-600 hover:underline">
                              {site.phone}
                            </a>
                          </div>
                        )}
                      </div>

                      {site.notes && (
                        <div className="mt-3 p-3 bg-slate-50 rounded text-sm text-slate-700">
                          <strong>Notes:</strong> {site.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingSiteId(site.id)}
                        className="gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        Modifier
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* SITE CREATION MODAL */}
      <SiteCreationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSiteCreated={handleSiteCreated}
      />
    </div>
  );
}
