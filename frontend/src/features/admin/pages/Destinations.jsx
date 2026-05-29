import { useState, useEffect } from "react";
import TablePagination, { paginateArray } from "@/components/TablePagination";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Search,
  MapPin,
  Plus,
  Edit,
  Trash2,
  X,
  MoreHorizontal,
  Eye,
  Map,
} from "lucide-react";

import DestinationModal from "../components/Destinations/DestinationModal";
import DeleteDestinationModal from "../components/Destinations/DeleteDestinationModal";
import DetailDestinationModal from "../components/Destinations/DetailDestinationModal";
import { destinationService } from "../services/destinationService";

export default function Destinations() {
  const [destinationList, setDestinationList] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 10;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await destinationService.getDestinations();
      if (res && res.status === "success") {
        setDestinationList(res.data || []);
      } else {
        setError("Failed to fetch destinations.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while loading destinations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, []);

  const filtered = destinationList.filter((d) =>
    d.nama_destinasi
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const triggerRefresh = () => {
    fetchDestinations();
  };

  const handleEditFromDetail = (item) => {
    setIsDetailModalOpen(false);
    setDetailItem(null);

    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground mb-1">
          Dashboard &gt;{" "}
          <span className="text-foreground font-medium">
            Destinations
          </span>
        </p>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h1 className="text-2xl font-bold">
            Destination Management
          </h1>

          <Button
            className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={16} />
            Add Destination
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Total Destinations
              </p>

              <h2 className="text-3xl font-bold">
                {destinationList.length}
              </h2>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl">
              <MapPin
                size={22}
                className="text-emerald-600"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Search Results
              </p>

              <h2 className="text-3xl font-bold">
                {filtered.length}
              </h2>
            </div>

            <div className="p-3 bg-blue-50 rounded-xl">
              <Map
                size={22}
                className="text-blue-600"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        {/* Search */}
        <div className="p-4 border-b flex items-center gap-3 bg-card rounded-t-xl">
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />

            <Input
              className="pl-9 bg-muted/50"
              placeholder="Search destination..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

          {search && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearch("")}
            >
              <X size={16} />
            </Button>
          )}
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-12 text-center">
                  No
                </TableHead>

                <TableHead>
                  Destination Name
                </TableHead>

                <TableHead className="text-center">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center py-10 text-muted-foreground"
                  >
                    Loading destinations...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center py-10 text-muted-foreground"
                  >
                    {error || "No destinations found."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.length === 0 ? <></> : paginateArray(filtered, currentPage, PER_PAGE).map((item, index) => (
                  <TableRow key={item.id_destinasi}>
                    <TableCell className="text-center">
                      {(currentPage - 1) * PER_PAGE + index + 1}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                          <MapPin
                            size={14}
                            className="text-emerald-600"
                          />
                        </div>

                        <span className="font-medium text-sm">
                          {item.nama_destinasi}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                          >
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setDetailItem(item);
                              setIsDetailModalOpen(
                                true
                              );
                            }}
                          >
                            <Eye
                              className="mr-2"
                              size={14}
                            />
                            View Detail
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              setEditingItem(item);
                              setIsEditModalOpen(
                                true
                              );
                            }}
                          >
                            <Edit
                              className="mr-2"
                              size={14}
                            />
                            Edit
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setDeletingItem(item);
                              setIsDeleteModalOpen(
                                true
                              );
                            }}
                          >
                            <Trash2
                              className="mr-2"
                              size={14}
                            />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalItems={filtered.length}
          perPage={PER_PAGE}
          onPageChange={setCurrentPage}
          label="destinasi"
        />
      </Card>

      {/* Add Modal */}
      <DestinationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={triggerRefresh}
        editData={null}
        destinationList={destinationList}
      />

      {/* Edit Modal */}
      <DestinationModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        onSuccess={triggerRefresh}
        editData={editingItem}
        destinationList={destinationList}
      />

      {/* Delete Modal */}
      <DeleteDestinationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingItem(null);
        }}
        onSuccess={triggerRefresh}
        item={deletingItem}
        destinationList={destinationList}
      />

      {/* Detail Modal */}
      <DetailDestinationModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailItem(null);
        }}
        item={detailItem}
        onEdit={handleEditFromDetail}
      />
    </div>
  );
}
