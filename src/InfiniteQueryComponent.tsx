import { Table } from 'antd';
import { useInfiniteQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useEffect } from 'react';

interface Item {
  id: number;
  name: string;
}

interface ApiResponse {
  item: Item[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  page: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Mock fetch function to simulate API call
const fetchItems = async (pageParam = 1): Promise<ApiResponse> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Calculate start and end items for this page
  const pageSize = 10;
  const start = (pageParam - 1) * pageSize + 1;
  const totalRecords = 300;
  
  // Create items for this page
  const items: Item[] = [];
  for (let i = 0; i < pageSize; i++) {
    const id = start + i;
    if (id <= totalRecords) {
      items.push({ id, name: `Item ${id}` });
    }
  }
  
  return {
    item: items,
    totalRecords: totalRecords,
    pageNumber: pageParam,
    pageSize: 10,
    page: pageParam,
    hasNextPage: pageParam * pageSize < totalRecords,
    hasPreviousPage: pageParam > 1
  };
};

export const useItemsQuery = () =>
  useInfiniteQuery({
    queryKey: ['items'],
    queryFn: ({ pageParam }) => fetchItems(pageParam),
    initialPageParam: 10,
    getPreviousPageParam: (firstPage) =>
      firstPage.hasPreviousPage ? firstPage.page - 1 : undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
  });

const queryClient = new QueryClient();

export default function InfiniteQueryComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <InfiniteQueryContent />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

function InfiniteQueryContent() {
  const [oldScrollHeight, setOldScrollHeight] = useState<number | null>(null);
  const {
    data,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    status,
  } = useItemsQuery();

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
  ];

  const dataSource = data?.pages.flatMap((page) => page.item);

  const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    if (scrollTop < 500 && hasPreviousPage && !isFetchingPreviousPage) {
      setOldScrollHeight(scrollHeight);
      fetchPreviousPage();
    }

    if (scrollHeight - scrollTop - clientHeight < 500 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  useEffect(() => {
    if (oldScrollHeight && !isFetchingPreviousPage) {
      const tableBody = document.querySelector('.ant-table-body') as HTMLDivElement;
      if (tableBody) {
        const heightDiff = tableBody.scrollHeight - oldScrollHeight;
        tableBody.scrollTop += heightDiff;
      }
      setOldScrollHeight(null);
    }
  }, [isFetchingPreviousPage, oldScrollHeight]);
  
  return (
    <div className="infinite-query-container">
      <h2>Infinite Query Example</h2>
      
      {status === 'pending' ? (
        <div>Loading...</div>
      ) : status === 'error' ? (
        <div>Error loading data</div>
      ) : (
        <>
          <Table
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            pagination={false}
            scroll={{ y: 300 }}
            size='small'
            onScroll={handleTableScroll}
          />
          <div className="stats">
            <p>Total records: {data.pages[0].totalRecords}</p>
            <p>Pages loaded: {data.pages.length}</p>
          </div>
        </>
      )}
    </div>
  );
}
